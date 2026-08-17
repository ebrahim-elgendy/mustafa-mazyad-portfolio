/**
 * Homepage hero background — the one intentional placeholder left in the
 * site, standing in until Mostafa supplies a real shot of himself/his work.
 * Every other placeholder (category covers, split-chooser art, gallery
 * filler items) has been removed in favor of honest empty states.
 */

const HERO_PHOTO_ID = "1554048612-b6a482bc67e5"; // camera raised toward the sun

export function heroPlaceholderImage(width: number, height: number): string {
  return `https://images.unsplash.com/photo-${HERO_PHOTO_ID}?q=80&w=${width}&h=${height}&fit=crop&auto=format`;
}
