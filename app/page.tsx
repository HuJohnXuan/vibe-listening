import { recommendations } from "../src/adapters/local_data/recommendation-catalog.ts";
import { tracks } from "../src/adapters/local_data/track-catalog.ts";
import { PlayerPage } from "../src/ui/player/player-page.tsx";

export default function Home() {
  return <PlayerPage playlist={tracks} recommendations={recommendations} />;
}
