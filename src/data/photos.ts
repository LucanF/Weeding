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
// „Prima privire" (2017): crop centrat pe cuplu din prima-privire.jpg (npm run images).
import primaPrivire from '../assets/photos/crops/prima-privire-cuplu.jpg';
import civilaParc from '../assets/photos/civila-parc.jpg';
import hero from '../assets/photos/hero.jpg';
import intrebarea from '../assets/photos/intrebarea.jpg';
import primulAcasa from '../assets/photos/primul-acasa.jpg';
import galerieAlee from '../assets/photos/galerie-alee.jpg';
import galerieImbratisare from '../assets/photos/galerie-imbratisare.jpg';
import galerieArcadaUmbra from '../assets/photos/galerie-arcada-umbra.jpg';
import galeriePortretSezut from '../assets/photos/galerie-portret-sezut.jpg';
import galeriePrivire from '../assets/photos/galerie-privire.jpg';
import heroMobile from '../assets/photos/crops/hero-mobile.jpg';
import rsvpMobile from '../assets/photos/crops/rsvp-mobile.jpg';
import finalMobile from '../assets/photos/crops/final-mobile.jpg';
import finalInvitatie from '../assets/photos/final-invitatie.jpg';
import lqip from './lqip.json';

export type PhotoKey = 'civila' | 'arcada' | 'inel' | 'intim' | 'apus' | 'portret'
  | 'primaPrivire'
  | 'civilaParc'
  | 'primulAcasa'
  | 'intrebarea'
  | 'galerieAlee'
  | 'galerieImbratisare'
  | 'galerieArcadaUmbra'
  | 'galeriePortretSezut'
  | 'galeriePrivire';

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
  primaPrivire: { src: primaPrivire, alt: 'Diana și Dragoș în parc, în lumina serii; ea stă în spatele lui, cu mâinile pe umerii lui', lqip: lqip.primaPrivire },
  civilaParc: { src: civilaParc, alt: 'Diana, în rochie albă, și Dragoș, în costum albastru, plimbându-se printr-un parc în ziua cununiei civile', lqip: lqip.civilaParc },
  intrebarea: { src: intrebarea, alt: 'Două mâini împreunate, cu inelul de logodnă, în fața unui brad de Crăciun plin de luminițe colorate', lqip: lqip.intrebarea },
  primulAcasa: { src: primulAcasa, alt: 'Dragoș și Diana, zâmbind într-un selfie, într-un parc cu iarbă verde și flori albe', lqip: lqip.primulAcasa },
  galerieAlee: { src: galerieAlee, alt: 'Diana și Dragoș plimbându-se de mână pe o alee umbrită, privindu-se zâmbind, în lumina aurie a serii', lqip: lqip.galerieAlee },
  galerieImbratisare: { src: galerieImbratisare, alt: 'Îmbrățișare văzută din spate; mâinile Dianei, cu inelul de logodnă, în jurul gâtului lui Dragoș', lqip: lqip.galerieImbratisare },
  galerieArcadaUmbra: { src: galerieArcadaUmbra, alt: 'Diana și Dragoș sărutându-se, sprijiniți de o arcadă de piatră, într-o pădure învăluită în umbră', lqip: lqip.galerieArcadaUmbra },
  galeriePortretSezut: { src: galeriePortretSezut, alt: 'Portret cu Diana zâmbind, sprijinită de umărul lui Dragoș, pe fundal de verdeață', lqip: lqip.galeriePortretSezut },
  galeriePrivire: { src: galeriePrivire, alt: 'Prim-plan cu Diana privindu-l pe Dragoș, într-o lumină caldă și intimă', lqip: lqip.galeriePrivire },
};

/** Poza care apare când se deschide plicul (hero). */
export const heroPhoto = {
  src: hero,
  alt: 'Diana și Dragoș plimbându-se pe iarbă, lângă un șir de bănci albastre',
};

/** Fundalul de final, din invitația tipărită (îmbrățișare, flori albe, chenar auriu). */
export const finalPhoto = {
  src: finalInvitatie,
  alt: 'Diana și Dragoș îmbrățișați, pe un fundal verde cu trandafiri albi și chenar auriu',
};

/** Crop-uri portret pentru mobil (art direction). */
export const crops = { heroMobile, rsvpMobile, finalMobile };

/** Ordinea din galerie. */
export const galleryOrder: PhotoKey[] = ['portret', 'civila', 'apus', 'arcada', 'intim', 'inel',
  'galerieAlee', 'galerieImbratisare', 'galerieArcadaUmbra', 'galeriePortretSezut', 'galeriePrivire'];
