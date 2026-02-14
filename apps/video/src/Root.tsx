import { Composition } from "remotion";
import { WingmanDemo } from "./WingmanDemo";

export const RemotionRoot = () => {
  return (
    <Composition
      id="WingmanDemo"
      component={WingmanDemo}
      durationInFrames={1000}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
