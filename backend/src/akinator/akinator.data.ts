/**
 * Perfis e traços do Akinator, copiados de frontend/src/Akinator.tsx
 * (branch feature/frontend-akinator) para que o backend e o modo demonstração
 * do frontend deduzam o mesmo personagem.
 */
import type { PersonDTO, TraitKey } from "./akinator.dto.ts";

export const TRAITS: Record<TraitKey, { label: string; question: string }> = {
  curto: { label: "Cabelo curto", question: "possui cabelo curto?" },
  loiro: { label: "Cabelo loiro", question: "tem cabelo loiro?" },
  cacheado: { label: "Cabelo cacheado", question: "tem cabelo cacheado?" },
  claros: { label: "Olhos claros", question: "tem olhos claros?" },
  oculos: { label: "Óculos", question: "usa óculos?" },
  barba: { label: "Barba", question: "tem barba?" },
  chapeu: { label: "Chapéu", question: "usa chapéu?" },
  sardas: { label: "Sardas", question: "tem sardas no rosto?" },
  brincos: { label: "Brincos", question: "usa brincos?" },
  sorriso: { label: "Sorrindo", question: "está sorrindo?" },
  bigode: { label: "Bigode", question: "tem bigode?" },
  colar: { label: "Colar", question: "usa colar?" },
  gravata: { label: "Gravata", question: "está usando gravata?" },
  ruivo: { label: "Cabelo ruivo", question: "tem cabelo ruivo?" },
  maquiagem: { label: "Maquiagem", question: "está usando maquiagem?" },
  piercing: { label: "Piercing", question: "usa piercing no nariz?" },
};

export const PEOPLE: PersonDTO[] = [
  { name: "Ana", traits: ["loiro", "claros", "sardas", "brincos", "sorriso", "colar", "maquiagem"] },
  { name: "Bruno", traits: ["curto", "barba", "oculos", "gravata"] },
  { name: "Caio", traits: ["cacheado", "claros", "sorriso", "ruivo", "piercing"] },
  { name: "Duda", traits: ["loiro", "oculos", "brincos", "maquiagem", "colar"] },
  { name: "Enzo", traits: ["curto", "loiro", "chapeu", "sorriso", "gravata"] },
  { name: "Fernanda", traits: ["cacheado", "sardas", "brincos", "sorriso", "colar"] },
  { name: "Gui", traits: ["curto", "barba", "chapeu", "oculos", "bigode"] },
  { name: "Helena", traits: ["loiro", "claros", "cacheado", "sorriso", "maquiagem"] },
  { name: "Ivo", traits: ["curto", "claros", "sardas", "chapeu", "piercing"] },
  { name: "Júlia", traits: ["cacheado", "oculos", "brincos", "maquiagem"] },
  { name: "Kai", traits: ["barba", "chapeu", "sorriso", "bigode", "colar"] },
  { name: "Lia", traits: ["loiro", "sardas", "oculos", "brincos", "piercing"] },
  { name: "Maya", traits: ["loiro", "cacheado", "oculos", "sorriso", "gravata"] },
  { name: "Nina", traits: ["curto", "brincos", "sardas", "maquiagem"] },
  { name: "Otto", traits: ["curto", "chapeu", "barba", "sorriso", "claros", "bigode"] },
  { name: "Paula", traits: ["cacheado", "loiro", "sardas", "oculos", "colar"] },
  { name: "Ravi", traits: ["curto", "cacheado", "barba", "brincos", "piercing"] },
  { name: "Sofia", traits: ["loiro", "chapeu", "brincos", "claros", "sorriso", "maquiagem"] },
  { name: "Theo", traits: ["curto", "oculos", "sardas", "sorriso", "gravata"] },
  { name: "Uma", traits: ["cacheado", "claros", "chapeu", "ruivo", "colar"] },
  { name: "Vitor", traits: ["curto", "loiro", "barba", "sardas", "bigode"] },
  { name: "Wesley", traits: ["cacheado", "barba", "chapeu", "oculos", "gravata"] },
  { name: "Yara", traits: ["loiro", "brincos", "sorriso", "claros", "maquiagem", "piercing"] },
  { name: "Zeca", traits: ["curto", "sardas", "chapeu", "oculos", "bigode"] },
];
