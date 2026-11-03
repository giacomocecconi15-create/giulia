import { describe, expect, it } from "vitest";
import { altDaDidascalia, categoriaDaDidascalia } from "../instagram/categorie";

describe("categoriaDaDidascalia", () => {
  it.each([
    ["✅ Trattamento CHERATINA LISCIANTE 🌟", "trattamenti"],
    ["✅ Schiariture Uomo 🤩💈👌", "schiariture"],
    ["Balayage caramello su lunghezze mosse", "schiariture"],
    ["Raccolto sposa con ricci e perle 💍", "sposa"],
    ["Taglio uomo sfumato con barba", "uomo"],
    ["Colore ricrescita e tonalizzante", "colore"],
    ["Nuovo bob con frangia", "donna"],
    ["", "donna"],
    [null, "donna"],
  ])("%s -> %s", (caption, cat) => expect(categoriaDaDidascalia(caption)).toBe(cat));

  it("l'hashtag #lu_ forza la categoria", () => {
    expect(categoriaDaDidascalia("Balayage per la sposa #lu_schiariture")).toBe("schiariture");
  });
});

describe("altDaDidascalia", () => {
  it("toglie hashtag, menzioni ed emoji", () => {
    expect(altDaDidascalia("✅ Trattamento CHERATINA LISCIANTE 🌟 #capelli @level_up_pesaro", "trattamenti")).toBe(
      "Trattamenti: Trattamento CHERATINA LISCIANTE",
    );
  });
  it("senza testo usa una descrizione generica", () => {
    expect(altDaDidascalia("#hair", "sposa")).toBe("Sposa, lavoro di Level Up Pesaro");
  });
});
