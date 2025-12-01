import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveAuthContext } from '@/lib/server-auth';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch posts (with optional user filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: postsData, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch profiles for all unique user_ids
    const userIds = [...new Set(postsData?.map(p => p.user_id) || [])];
    const { data: profilesData } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, avatar_url, role')
      .in('id', userIds);

    // Create a map for quick lookup
    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

    // Combine posts with profiles
    const posts = postsData?.map(post => ({
      ...post,
      profiles: profilesMap.get(post.user_id) || null,
    })) || [];

    return NextResponse.json({ posts });
  } catch (err) {
    console.error('Error fetching posts:', err);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

// POST - Create new post
export async function POST(request: NextRequest) {
  try {
    const authResult = await resolveAuthContext(request);
    if ('response' in authResult) {
      return authResult.response;
    }

    const { userId } = authResult;

    const formData = await request.formData();
    const caption = formData.get('caption') as string;
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (image.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    // Upload image to storage
    const fileExt = image.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from('posts')
      .upload(fileName, buffer, {
        contentType: image.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('posts')
      .getPublicUrl(fileName);

    // Create post record
    const { data: post, error: insertError } = await supabaseAdmin
      .from('posts')
      .insert({
        user_id: userId,
        caption: caption || null,
        image_url: urlData.publicUrl,
      })
      .select('*')
      .single();

    if (insertError) {
      // Clean up uploaded image if insert fails
      await supabaseAdmin.storage.from('posts').remove([fileName]);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Fetch profile for the post
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, avatar_url, role')
      .eq('id', userId)
      .single();

    return NextResponse.json({ post: { ...post, profiles: profileData } });
  } catch (err) {
    console.error('Error creating post:', err);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}

// DELETE - Delete a post
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await resolveAuthContext(request);
    if ('response' in authResult) {
      return authResult.response;
    }

    const { userId, profile } = authResult;

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    // Get post to verify ownership and get image URL
    const { data: post, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check ownership (allow admin to delete any post)
    if (post.user_id !== userId && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Delete image from storage
    if (post.image_url) {
      const urlParts = post.image_url.split('/posts/');
      if (urlParts[1]) {
        await supabaseAdmin.storage.from('posts').remove([urlParts[1]]);
      }
    }

    // Delete post record
    const { error: deleteError } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', postId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting post:', err);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
