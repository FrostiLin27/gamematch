"use client";

import { useEffect, useRef, useState } from "react";

const musicTracks = [
  { title: "天空之城", src: "/audio/castle-in-the-sky.mp3" },
  { title: "冰原雪域", src: "/audio/frozen-snowfield.mp3" },
  { title: "魔法森林", src: "/audio/magic-forest.mp3" },
] as const;

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const mutedRef = useRef(false);
  const [trackIndex, setTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);
  const activeIndex = trackIndex ?? 0;

  function tryPlay() {
    const audio = audioRef.current;
    if (!audio || !audio.src || mutedRef.current) return;
    void audio.play().then(() => {
      setIsPlaying(true);
      setNeedsGesture(false);
    }).catch(() => {
      setIsPlaying(false);
      setNeedsGesture(true);
    });
  }

  useEffect(() => {
    setTrackIndex(Math.floor(Math.random() * musicTracks.length));
  }, []);

  useEffect(() => {
    if (trackIndex === null) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = musicTracks[trackIndex].src;
    audio.volume = 0.3;
    audio.load();
    tryPlay();
  }, [trackIndex]);

  useEffect(() => {
    const handleFirstInteraction = () => tryPlay();
    document.addEventListener("pointerdown", handleFirstInteraction);
    return () => document.removeEventListener("pointerdown", handleFirstInteraction);
  }, []);

  function switchTrack() {
    setTrackIndex((current) => ((current ?? 0) + 1) % musicTracks.length);
  }

  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) {
      mutedRef.current = false;
      setIsMuted(false);
      tryPlay();
    } else {
      mutedRef.current = true;
      audio.pause();
      setIsMuted(true);
      setIsPlaying(false);
      setNeedsGesture(false);
    }
  }

  return <div className="music-player"><audio ref={audioRef} loop preload="auto" aria-hidden="true" /><span className={`music-icon ${isPlaying ? "playing" : ""}`} aria-hidden="true">♫</span><div className="music-meta"><small>BACKGROUND MUSIC</small><strong>{musicTracks[activeIndex].title}</strong></div><button className="music-next" type="button" onClick={switchTrack} aria-label="切換背景音樂">換一首</button><button className="music-toggle" type="button" onClick={toggleMusic} aria-label={isMuted ? "播放背景音樂" : "關閉背景音樂"}>{isMuted ? "播放" : needsGesture ? "點擊播放" : "關閉"}</button></div>;
}
