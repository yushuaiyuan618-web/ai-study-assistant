# Learning Journal PDF font

`JournalSans-Regular.ttf` is the weight-400 static instance of Noto Sans SC 2.004,
from Google Fonts. It includes the upstream Simplified Chinese repertoire, Latin
text and symbols; PDF exports embed only the glyph subsets they use.

- Upstream: https://github.com/google/fonts/tree/main/ofl/notosanssc
- Source: `NotoSansSC[wght].ttf`
- Conversion: FontTools `instantiateVariableFont(font, {"wght": 400})`
- License: SIL Open Font License 1.1; the unmodified notice is in `OFL.txt`.

The static instance avoids runtime FontTools dependencies and operating-system
font requirements. Fonts are loaded from disk, never from a CDN during export.
