export const ALLOWED_ADMIN_IMAGE_TYPES = ['image/webp', 'image/avif'];
export const ALLOWED_ADMIN_IMAGE_EXTENSIONS = ['.webp', '.avif'];

export const isAllowedAdminImageFile = (file) => {
  if (!file) return false;
  const fileName = String(file.name || '').toLowerCase();
  return (
    ALLOWED_ADMIN_IMAGE_TYPES.includes(file.type) ||
    ALLOWED_ADMIN_IMAGE_EXTENSIONS.some((extension) => fileName.endsWith(extension))
  );
};

export const adminImageFormatMessage = 'Only WebP or AVIF images are allowed.';
