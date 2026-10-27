/**
 * Pozele site-ului. Pentru a înlocui o poză: suprascrie fișierul cu același nume
 * din src/assets/photos/ și rulează `npm run images` (regenerează crop-urile de
 * mobil, og:image și placeholder-ele). Textele alternative (alt) sunt mai jos.
 */
import type { ImageMetadata } from 'astro';
import civila from '../assets/photos/civila.jpg';
import arcada from '../assets/photos/arcada.jpg';
import inel from '../assets/photos/inel.jpg';
import intim from '../assets/photos/intim.jpg';
import apus from '../assets/photos/apus.jpg';
import portret from '../assets/photos/portret.jpg';
import heroMobile from '../assets/photos/crops/hero-mobile.jpg';
import rsvpMobile from '../assets/photos/crops/rsvp-mobile.jpg';
import finalMobile from '../assets/photos/crops/final-mobile.jpg';
import finalInvitatie from '../assets/photos/final-invitatie.jpg';
import lqip from './lqip.json';

export type PhotoKey = 'civila' | 'arcada' | 'inel' | 'intim' | 'apus' | 'portret';

export interface Photo {
  src: ImageMetadata;
  alt: string;
  lqip: string;
}

export const photos: Record<PhotoKey, Photo> = {
  civila: { src: civila, alt: 'Diana, în rochie albă, și Dragoș, în costum albastru, plimbându-se de mână pe o alee cu tei', lqip: lqip.civila },
  arcada: { src: arcada, alt: 'Diana și Dragoș sărutându-se lângă o arcadă de piatră acoperită de iederă, în lumina serii', lqip: lqip.arcada },
  inel: { src: inel, alt: 'Diana îl îmbrățișează pe Dragoș; pe degetul ei strălucește inelul de logodnă', lqip: lqip.inel },
  intim: { src: intim, alt: 'Prim-plan cu Diana sprijinită de umărul lui Dragoș, în lumină caldă', lqip: lqip.intim },
  apus: { src: apus, alt: 'Diana și Dragoș plimbându-se pe o pantă verde, pe lângă un șir de bănci albastre, la apus', lqip: lqip.apus },
  portret: { src: portret, alt: 'Portret al Dianei și al lui Dragoș, zâmbind, în fața unui gard viu', lqip: lqip.portret },
};

/** Fundalul de final, din invitația tipărită (îmbrățișare, flori albe, chenar auriu). */
export const finalPhoto = {
  src: finalInvitatie,
  alt: 'Diana și Dragoș îmbrățișați, pe un fundal verde cu trandafiri albi și chenar auriu',
};

/** Crop-uri portret pentru mobil (art direction). */
export const crops = { heroMobile, rsvpMobile, finalMobile };

/** Ordinea din galerie. */
export const galleryOrder: PhotoKey[] = ['portret', 'civila', 'apus', 'arcada', 'intim', 'inel'];
