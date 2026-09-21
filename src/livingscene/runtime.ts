/** Shared, mutable "world flags" the activities read and write (fire, laundry, easel, snowman...). */
export interface Runtime {
  fire: number; laundry: boolean; easel: boolean; snowman: number; leafPile: number; pumpkin: boolean; jar: boolean; lights: boolean;
  doorTarget: number; occupied: boolean; sleeping: boolean; logs: number; umbrella: boolean; lantern: boolean; kite: boolean; stew: boolean; diggingX: number;
}
export const newRuntime = (): Runtime => ({ fire: 0, laundry: false, easel: false, snowman: 0, leafPile: 0, pumpkin: false, jar: false, lights: false, doorTarget: 0, occupied: false, sleeping: false, logs: 3, umbrella: false, lantern: false, kite: false, stew: false, diggingX: 0 });
