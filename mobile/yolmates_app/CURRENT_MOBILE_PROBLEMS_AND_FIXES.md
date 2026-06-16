# Current Mobile Problems And Fixes

## Fixed in this pass

1. Trip list horizontal overflow
   - Cause: the filter bar and selected-trip CTA used fixed rows that broke on narrow screens.
   - Fix: made the filters horizontally scrollable and changed trip metadata to a wrapping layout.

2. Blank or slow route map
   - Cause: the app defaulted to `google_maps_flutter`, which is heavier locally and fails when native map setup is incomplete.
   - Fix: switched `RouteMapView` to the existing canvas renderer by default.

3. Ride search ignored the selected date
   - Cause: the search provider always used `DateTime.now()`.
   - Fix: added `date` to `RideSearchParams` and passed it into the repository search.

4. Mobile API search parsed backend results incorrectly
   - Cause: search expected a raw list or `data`, while backend returns paginated `items`.
   - Fix: `ApiRidesRepository` now reads `items`.

5. Mock mode felt slow
   - Cause: artificial mock latency was high for normal local testing.
   - Fix: reduced mock repository delay.

6. Profile photo add did not work
   - Cause: profile setup had no image picker or preview.
   - Fix: added gallery pick and local avatar preview.

7. Language change during account setup did not update the UI
   - Cause: the screen stored the language only on final submit.
   - Fix: profile setup now updates `languageProvider` immediately and persists it on submit.

8. Welcome screens always opened in Azerbaijani
   - Cause: language default was hardcoded until a stored preference existed.
   - Fix: app language now boots from the phone locale when no saved language is present.

9. Onboarding visuals were weak
   - Cause: onboarding used placeholder illustrations.
   - Fix: replaced them with curated travel/carpool stock-photo style imagery from Pexels.

## Still worth checking

1. Wider localization cleanup
   - There are still signs of older encoding damage in some strings elsewhere in the repo.
   - The highest-impact mobile flows touched in this pass were corrected first.

2. Native Google Maps configuration
   - If the product still needs native Google Maps on mobile, verify platform API keys and plugin setup separately.
   - The canvas route map is now the reliable default.

3. Backend-hosted avatar uploads
   - Current profile photo support is local-first.
   - If shared/server avatars are required, add a dedicated upload endpoint that returns a public URL.
