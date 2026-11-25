# Kerstkaarten 2026

Overzicht van wie dit jaar een kerstkaart van Blom krijgt, met of zonder geschenk, en van wie de kaart komt. Per relatie staan het adres voor de envelop, de handgeschreven tekst, de toelichting en de kosten.

De pagina is overgezet uit een Claude-artifact (stand 25 november 2026). Werking en vormgeving zijn gelijk gebleven.

## Inloggen

Inloggen gaat met het centrale Blom-account, hetzelfde als op de startpagina (blominterieurs.github.io) en in de Collectiekeuze. Staat de pagina op hetzelfde adres als de startpagina, dan deelt ze de inlog: wie op de startpagina is ingelogd, is hier automatisch ingelogd, en andersom.

Toegang heeft wie op de gebruikerslijst van de Collectiekeuze staat. Accounts beheer je daar (Menu, Gebruikers); er is geen aparte lijst voor de kerstkaarten.

## Waar de gegevens staan

In deze repo staan geen relatiegegevens. Alles staat in Supabase, project **Database V1**, schema **`kerstkaarten_2026`**:

| Tabel | Inhoud |
| --- | --- |
| `kerstkaarten_2026.gegevens` | De lijst zelf: rij `kaarten` (alle relaties), `uitleg` (de tekst onder "Hoe is deze selectie gemaakt?"), `prijs` en `donatie` |
| `kerstkaarten_2026.aangepaste_kaarten` | Per aangepaste relatie één rij. `data.cur` bevat de velden die nu afwijken van het origineel, `data.hist` de geschiedenis: wie, wanneer, oud, nieuw en toelichting |
| `kerstkaarten_2026.toegevoegde_kaarten` | Per toegevoegde kaart één rij met alle velden. `data.deleted = true` betekent dat de kaart weer is verwijderd |

De rijen met aanpassingen hebben ook `bijgewerkt_op` en `bijgewerkt_door` (het e-mailadres waarmee is ingelogd). Het `id` van een aangepaste kaart is het `id` van de relatie in de rij `kaarten`.

De pagina praat alleen met drie functies: `public.kerstkaarten_2026_gegevens` (de lijst), `public.kerstkaarten_2026_lees` (aanpassingen) en `public.kerstkaarten_2026_zet` (opslaan). De tabellen zelf zijn van buitenaf niet te benaderen. De pagina haalt elke 20 seconden de laatste aanpassingen op, zodat je die van collega's ziet.

## Opbouw

| Pad | Inhoud |
| --- | --- |
| `index.html` | Inlogscherm en de pagina: kop, selectie en de vensters voor aanpassen |
| `css/stijl.css` | Opmaak in de Blom-huisstijl |
| `js/opslag.js`, `js/config.js` | Inloggen, gegevens ophalen en aanpassingen opslaan |
| `js/app.js` | Filters, kaartweergave in 3D, begroting, aanpassen en Excel-download; start na het inloggen |
| `js/vendor/` | Supabase-bibliotheek (zelfde versie als de startpagina) |
| `supabase/migrations/` | De tabellen en functies in de database |
| `img/` | Voor-, binnen- en achterkant van de kaart en de foto's van de geschenken |

## Lokaal bekijken

Start een server in deze map en ga naar http://localhost:8765:

```
python -m http.server 8765
```

Lokaal log je apart in: de gedeelde inlog geldt alleen op het adres van de startpagina.
