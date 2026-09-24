## 2024-05-20 - Adding lazy loading correctly
**Learning:** Adding `loading="lazy"` blindly to all images is an anti-pattern. Above-the-fold images (like user avatars in the header or main hero images) should NOT have lazy loading as it delays the Largest Contentful Paint (LCP) and hurts perceived performance.
**Action:** When adding lazy loading, carefully verify the image context and only apply it to images that are guaranteed to be off-screen initially, such as images inside modals, long lists, or carousels.
