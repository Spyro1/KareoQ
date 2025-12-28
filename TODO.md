# TODO - Teendők

- [x] Beérkezett kérésekre IP cím szűrést csinálni, két kérés lehet maximum egy IP-ről egyszerre a sorban
- [x] Lejátszott számokat is lehessen látni, és visszarakni a queue-ba, ha véletlen volt
- [x] Statisztika: Lejátszott számok száma, stb  
- [NOT NEEDED] Felhasználói zene kérés után jelezzen vissza, hányan vannak előtte
- [ ] Felhasználó telefonjának értesítése, ha ő következik
- [ ] Karaoke életciklus kezelése
  - Alapállapot: Nincs karaoke
  - Karaoke indulásakor minden kérés státuszát várakozóra állítani
  - Amikor egy szám elindul, annak a státuszát folyamatbanira állítani
  - Amikor egy szám véget ér, annak a státuszát lejátszott-ra állítani, és a következőt folyamatbanira állítani
  - [ ] Állapotok meghatározása
    - Új kérés (Létrehozás után, amíg nem indul el a karaoke)
    - Várakozó (Ha elindul a karaoke)
    - Folyamatban (Ha éppen ő következik)
    - Lejátszott (Ha elénekelték)