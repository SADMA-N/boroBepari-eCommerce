select
    count(*) as total,
    min(id) as min_id,
    max(id) as max_id,
    count(*) filter (where slug ~ '-[0-9]+$') as slug_pattern,
    count(*) filter (where images::text like '%picsum.photos/seed/product%') as picsum_images
  from products;