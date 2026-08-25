"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { formatPlaybackTime } from "../../core/player/player-state.ts";
import { buildListeningAtmosphere } from "../../core/vibe/build-listening-atmosphere.ts";
import type {
  RadarRecommendations,
  RecommendedTrack,
} from "../../types/discovery.ts";
import type { Recommendation } from "../../types/recommendation.ts";
import type { Track } from "../../types/track.ts";
import {
  usePlayerView,
  type LaterQueueController,
  type LocalAudioController,
} from "./use-player-view.ts";

const TAG_GROUPS = [
  ["类型", "genres"],
  ["情绪", "moods"],
  ["人声", "voices"],
  ["制作", "production"],
] as const;

const RADAR_ROUTES = [
  ["same_artist", "Same Artist, Deeper Cut"],
  ["same_room", "Same Room"],
  ["similar_voice", "Similar Voice"],
  ["production_texture", "Production Texture"],
] as const;

interface PlayerPageProps {
  readonly playlist: readonly Track[];
  readonly recommendations: readonly Recommendation[];
}

function TurntableRegion(
  { track, isPlaying }: { track: Track; isPlaying: boolean },
) {
  return (
    <section className="turntable-region" data-region="turntable" aria-label="黑胶播放区域">
      <span className="turntable-signature">Vibe Listening</span>
      <div className="turntable-plinth">
        <div className={`record${isPlaying ? " is-playing" : ""}`} aria-hidden="true">
          <div className="record-label"><img src={track.coverUrl} alt="" /><i /></div>
        </div>
        <div className="tonearm" aria-hidden="true">
          <i className="tonearm-pivot" />
          <div className={`tonearm-moving${isPlaying ? " is-playing" : ""}`}>
            <div className="tonearm-bar"><i className="tonearm-head" /></div>
          </div>
        </div>
        <div className="metal-control" aria-hidden="true" />
      </div>
    </section>
  );
}

function CurrentTrack({ track }: { track: Track }) {
  return (
    <header className="current-track" data-section="current-track" data-track-id={track.id}>
      <span className="eyebrow">NOW PLAYING</span>
      <h1>{track.title}</h1>
      <p className="track-meta">{track.artist} <i /> {track.album}</p>
      <blockquote>“{track.lyricsExcerpt}”</blockquote>
    </header>
  );
}

function ListeningAtmosphere({ track }: { track: Track }) {
  const [memory, setMemory] = useState("");
  const atmosphere = buildListeningAtmosphere({ track, memory });
  return (
    <section className="listening-atmosphere" data-section="listening-atmosphere">
      <div className="section-heading"><h2>{atmosphere.title}</h2><span>VIBE</span></div>
      <p className="atmosphere-background">{atmosphere.background}</p>
      <p>{atmosphere.detail}</p>
      <label htmlFor={`memory-${track.id}`}>给这首歌留一句记忆</label>
      <textarea id={`memory-${track.id}`} value={memory} maxLength={60}
        placeholder="例如：下雨的末班车" aria-label="给这首歌留一句记忆"
        onChange={(event) => setMemory(event.currentTarget.value)} />
      <p className="memory-effect" data-memory-effect="true">{atmosphere.memoryEffect}</p>
    </section>
  );
}

function ListeningNotes({ track }: { track: Track }) {
  return (
    <section className="listening-notes" data-section="listening-notes">
      <div className="section-heading"><h2>Listening Notes</h2><span>01</span></div>
      <p data-listening-note="true">{track.listeningNote}</p>
      <div className="tag-groups">
        {TAG_GROUPS.map(([label, key]) => (
          <div className="tag-row" data-note-group="true" key={key}>
            <span>{label}</span>
            <div>
              {track.tags[key].map((tag) => (
                <span className="note-tag" data-note-tag="true" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

interface TonightsPicksProps {
  readonly picks: readonly RecommendedTrack[];
  readonly onPlayTrack: (trackId: string) => void;
  readonly onAddToLater: (trackId: string) => void;
  readonly isInLater: (trackId: string) => boolean;
}

interface RecommendationRowProps {
  readonly recommendation: RecommendedTrack;
  readonly onPlayTrack: (trackId: string) => void;
  readonly onAddToLater: (trackId: string) => void;
  readonly isInLater: (trackId: string) => boolean;
}

function LaterAddButton({
  track,
  isAdded,
  source,
  onAdd,
}: {
  track: Track;
  isAdded: boolean;
  source: "pick" | "radar";
  onAdd: (trackId: string) => void;
}) {
  const laterLabel = isAdded
    ? `${track.title} 已加入 Later`
    : `加入 ${track.title} 到 Later`;
  return (
    <button className={`later-action${isAdded ? " is-added" : ""}`}
      type="button" data-pick-later={source === "pick" || undefined}
      data-radar-later={source === "radar" || undefined} aria-label={laterLabel}
      title={isAdded ? "已加入 Later" : "加入 Later"} disabled={isAdded}
      onClick={() => onAdd(track.id)}>
      {isAdded ? "✓" : "+"}
    </button>
  );
}

function RecommendationRow({
  recommendation,
  onPlayTrack,
  onAddToLater,
  isInLater,
}: RecommendationRowProps) {
  const { track, reason } = recommendation;
  const isAdded = isInLater(track.id);
  return (
    <article data-recommendation-row="true">
      <button className="recommendation-select" type="button" data-pick-play="true"
        aria-label={`播放 ${track.title}`} onClick={() => onPlayTrack(track.id)}>
        <img src={track.coverUrl} alt="" />
        <span className="recommendation-copy">
          <strong>{track.title}</strong><small>{track.artist}</small><span>{reason}</span>
        </span>
      </button>
      <LaterAddButton track={track} isAdded={isAdded} source="pick" onAdd={onAddToLater} />
    </article>
  );
}

function TonightsPicks({
  picks,
  onPlayTrack,
  onAddToLater,
  isInLater,
}: TonightsPicksProps) {
  return (
    <section className="tonights-picks" data-section="tonights-picks">
      <div className="section-heading"><h2>Tonight’s Picks</h2><span>FOR THIS ROOM</span></div>
      <div className="recommendation-list">
        {picks.map((recommendation) => (
          <RecommendationRow
            recommendation={recommendation}
            onPlayTrack={onPlayTrack}
            onAddToLater={onAddToLater}
            isInLater={isInLater}
            key={recommendation.track.id}
          />
        ))}
      </div>
    </section>
  );
}

function RadarRouteRow({
  label,
  recommendation,
  routeNumber,
  onAddToLater,
  isInLater,
}: {
  label: string;
  recommendation: RecommendedTrack | undefined;
  routeNumber: string;
  onAddToLater: (trackId: string) => void;
  isInLater: (trackId: string) => boolean;
}) {
  return (
    <article className="radar-route" data-radar-route="true">
      <header><span>{routeNumber}</span><h3>{label}</h3></header>
      {recommendation ? (
        <div className="radar-result">
          <img src={recommendation.track.coverUrl} alt="" />
          <span>
            <strong>{recommendation.track.title}</strong>
            <small>{recommendation.track.artist}</small>
            <span>{recommendation.reason}</span>
          </span>
          <LaterAddButton
            track={recommendation.track}
            isAdded={isInLater(recommendation.track.id)}
            source="radar"
            onAdd={onAddToLater}
          />
        </div>
      ) : <p>这一条路线暂时没有合适的歌曲。</p>}
    </article>
  );
}

function RadarDisclosure({
  radar,
  onAddToLater,
  isInLater,
}: {
  radar: RadarRecommendations;
  onAddToLater: (trackId: string) => void;
  isInLater: (trackId: string) => boolean;
}) {
  return (
    <details className="radar-disclosure" data-section="radar" name="discovery-panel">
      <summary aria-label="展开或收起 Radar">
        <strong>Radar</strong>
        <span className="radar-closed-copy">EXPLORE 04</span>
        <span className="radar-open-copy">CLOSE ×</span>
      </summary>
      <div className="radar-panel">
        <header><span>FOUR WAYS INTO THE ROOM</span><h2>Listening Radar</h2></header>
        <div className="radar-routes">
          {RADAR_ROUTES.map(([key, label], index) => (
            <RadarRouteRow
              label={label}
              recommendation={radar[key][0]}
              routeNumber={String(index + 1).padStart(2, "0")}
              onAddToLater={onAddToLater}
              isInLater={isInLater}
              key={key}
            />
          ))}
        </div>
      </div>
    </details>
  );
}

function LaterQueueRow({
  track,
  onPlayTrack,
  onRemoveTrack,
}: {
  track: Track;
  onPlayTrack: (trackId: string) => void;
  onRemoveTrack: (trackId: string) => void;
}) {
  return (
    <article className="later-row" data-later-row="true">
      <button className="later-track-select" type="button" data-later-play="true"
        aria-label={`播放 Later 中的 ${track.title}`} onClick={() => onPlayTrack(track.id)}>
        <img src={track.coverUrl} alt="" />
        <span><strong>{track.title}</strong><small>{track.artist}</small></span>
      </button>
      <button className="later-remove" type="button" data-later-remove="true"
        aria-label={`从 Later 移除 ${track.title}`} onClick={() => onRemoveTrack(track.id)}>
        ×
      </button>
    </article>
  );
}

function LaterDisclosure({
  tracks,
  onPlayTrack,
  onRemoveTrack,
}: {
  tracks: readonly Track[];
  onPlayTrack: (trackId: string) => void;
  onRemoveTrack: (trackId: string) => void;
}) {
  return (
    <details className="later-disclosure" data-section="later" name="discovery-panel">
      <summary aria-label="展开或收起 Later">
        <strong>Later</strong><span className="later-closed-copy">{String(tracks.length).padStart(2, "0")}</span>
        <span className="later-open-copy">CLOSE ×</span>
      </summary>
      <div className="later-panel">
        <header><span>YOUR LISTENING QUEUE</span><h2>Later</h2></header>
        {tracks.length === 0 ? <p className="later-empty">还没有加入歌曲</p> : (
          <div className="later-list">
            {tracks.map((track) => (
              <LaterQueueRow track={track} onPlayTrack={onPlayTrack}
                onRemoveTrack={onRemoveTrack} key={track.id} />
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

function ListeningRegion(
  {
    track,
    picks,
    radar,
    player,
    later,
  }: {
    track: Track;
    picks: readonly RecommendedTrack[];
    radar: RadarRecommendations;
    player: LocalAudioController;
    later: LaterQueueController;
  },
) {
  return (
    <section className="listening-region" data-region="listening" aria-label="歌曲与发现区域">
      <CurrentTrack track={track} />
      <ListeningAtmosphere track={track} />
      <ListeningNotes track={track} />
      <div className="discovery-tools">
        <RadarDisclosure radar={radar} onAddToLater={later.addTrack}
          isInLater={later.hasTrack} />
        <LaterDisclosure tracks={later.tracks} onPlayTrack={player.playTrack}
          onRemoveTrack={later.removeTrack} />
      </div>
      <TonightsPicks
        picks={picks}
        onPlayTrack={player.playTrack}
        onAddToLater={later.addTrack}
        isInLater={later.hasTrack}
      />
    </section>
  );
}

function PlayerControls({ player }: { player: LocalAudioController }) {
  const maximum = player.durationSeconds || 0;
  const progressPercent = maximum > 0
    ? Math.min(100, (player.elapsedSeconds / maximum) * 100)
    : 0;
  return (
    <footer className="player-controls" data-region="player-controls" aria-label="播放控制区域">
      <div className="progress-row">
        <span>{formatPlaybackTime(player.elapsedSeconds)}</span>
        <input
          className="progress-track"
          type="range"
          min="0"
          max={maximum}
          step="0.01"
          value={Math.min(player.elapsedSeconds, maximum)}
          style={{
            background: `linear-gradient(to right, var(--color-progress) 0 ${progressPercent}%, rgba(248, 244, 238, 0.1) ${progressPercent}% 100%)`,
          }}
          aria-label="播放进度"
          onInput={(event) => player.seek(Number(event.currentTarget.value))}
        />
        <span>{formatPlaybackTime(player.durationSeconds)}</span>
      </div>
      <TransportControls player={player} />
      {player.playbackError && <p className="playback-error" role="status">{player.playbackError}</p>}
    </footer>
  );
}

function FavoriteControl({ trackId }: { trackId: string }) {
  const [favoriteTrackIds, setFavoriteTrackIds] =
    useState<ReadonlySet<string>>(() => new Set());
  const isFavorite = favoriteTrackIds.has(trackId);
  const label = isFavorite ? "取消喜欢当前歌曲" : "喜欢当前歌曲";
  const toggleFavorite = () => {
    setFavoriteTrackIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(trackId)) nextIds.delete(trackId);
      else nextIds.add(trackId);
      return nextIds;
    });
  };
  return (
    <button className="favorite-control" type="button" data-player-favorite="true"
      aria-label={label} title={label} aria-pressed={isFavorite}
      onClick={toggleFavorite}>
      <span aria-hidden="true">{isFavorite ? "♥" : "♡"}</span>
    </button>
  );
}

function TransportControls({ player }: { player: LocalAudioController }) {
  const playLabel = player.isPlaying ? "暂停" : "播放";
  return (
    <div className="control-row">
      <div className="control-tools">
        <FavoriteControl trackId={player.audioTrack.id} />
      </div>
      <div className="transport-controls">
        <button type="button" aria-label="上一首" title="上一首" onClick={player.playPrevious}>
          <i className="previous-glyph" aria-hidden="true" />
        </button>
        <button className="primary-control" type="button" aria-label={playLabel} title={playLabel} onClick={player.togglePlayback}>
          <i className={player.isPlaying ? "pause-glyph" : "play-glyph"} aria-hidden="true" />
        </button>
        <button type="button" aria-label="下一首" title="下一首" onClick={player.playNext}>
          <i className="next-glyph" aria-hidden="true" />
        </button>
      </div>
      <div className="volume-guide" aria-hidden="true"><i /><span /></div>
    </div>
  );
}

export function PlayerPage({ playlist, recommendations }: PlayerPageProps) {
  const { audioRef, player, later, displayTrack, discovery } =
    usePlayerView(playlist, recommendations);
  return (
    <main className="room-shell">
      <audio
        data-audio-player="true"
        hidden
        ref={audioRef}
        src={player.audioTrack.previewAudioUrl}
        preload="metadata"
        onLoadedMetadata={player.syncDuration}
        onTimeUpdate={player.syncElapsed}
        onPlay={player.markPlaying}
        onPause={player.markPaused}
        onEnded={player.markPaused}
      />
      <div className="ambient-light" aria-hidden="true" />
      <header className="room-header"><span>VL</span><i /><span>SONG × MEMORY LISTENING</span></header>
      <div className="stage-grid">
        <TurntableRegion track={displayTrack} isPlaying={player.isPlaying} />
        <ListeningRegion
          track={displayTrack}
          picks={discovery.tonightsPicks}
          radar={discovery.radar}
          player={player}
          later={later}
        />
      </div>
      <PlayerControls player={player} />
    </main>
  );
}
