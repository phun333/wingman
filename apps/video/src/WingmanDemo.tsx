import type React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

import { IntroScene } from "./scenes/IntroScene";
import { ProblemScene } from "./scenes/ProblemScene";
import { SolutionScene } from "./scenes/SolutionScene";
import { FeaturesScene } from "./scenes/FeaturesScene";
import { PipelineScene } from "./scenes/PipelineScene";
import { TechStackScene } from "./scenes/TechStackScene";
import { OutroScene } from "./scenes/OutroScene";

/**
 * Wingman Hackathon Demo Video
 *
 * 30 seconds @ 30fps = 900 frames
 *
 * Scene breakdown:
 *   1. Intro        — 150 frames (5s)  — Logo reveal + title
 *   2. Problem      — 150 frames (5s)  — Why interviews are hard
 *   3. Solution     — 150 frames (5s)  — Meet Wingman
 *   4. Features     — 150 frames (5s)  — Feature cards
 *   5. Pipeline     — 150 frames (5s)  — Voice interview pipeline
 *   6. Tech Stack   — 120 frames (4s)  — Technologies + stats
 *   7. Outro        — 120 frames (4s)  — CTA + closing
 *
 * Transitions: 20-frame fades between scenes (overlapping ~0.67s each)
 * Total: 990 - 6*20 = 870 frames ≈ 29s → We set composition to 900 frames for padding
 */
export const WingmanDemo: React.FC = () => {
  const TRANSITION_DURATION = 20;

  return (
    <AbsoluteFill style={{ backgroundColor: "#07070a" }}>
      <TransitionSeries>
        {/* Scene 1: Intro */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <IntroScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        {/* Scene 2: Problem */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <ProblemScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        {/* Scene 3: Solution */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <SolutionScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        {/* Scene 4: Features */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <FeaturesScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        {/* Scene 5: Pipeline */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <PipelineScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        {/* Scene 6: Tech Stack */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <TechStackScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        {/* Scene 7: Outro */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
