export type PneumaticComponentKind =
  | "compressor"
  | "button"
  | "cylinder"
  | "splitter";
export type PneumaticComponentDescription =
  | {
      kind: "compressor";
      id: string;
      terminalIds: ["1"];
    }
  | {
      kind: "button";
      id: string;
      terminalIds: ["1", "2"];
    }
  | {
      kind: "cylinder";
      id: string;
      terminalIds: ["1"];
    }
  | {
      kind: "splitter";
      id: string;
      terminalIds: ["1", "2", "3"];
    };

export type PneumaticPipeDescription = {
  id: string;
};

export type PneumaticCompressorState = {
  _id: string;
  _kind: "compressor";
  alert: string | null;
  terminalPressures: {
    1: number;
  };
  connectedTubes?: string[];
};

export type PneumaticButtonState = {
  _id: string;
  _kind: "button";
  leftPressed: boolean;
  rightPressed: boolean;
  alert: string | null;
  terminalPressures: {
    1: number;
    2: number;
    3: number;
    4: number;
  };
  connectedTubes?: string[];
};

export type PneumaticCylinderState = {
  _id: string;
  _kind: "cylinder";
  expansion: number;
  alert: string | null;
  terminalPressures: {
    1: number;
  };
  connectedTubes?: string[];
};

export type PneumaticSplitterState = {
  _id: string;
  _kind: "splitter";
  alert: string | null;
  terminalPressures: {
    1: number;
    2: number;
    3: number;
  };
  connectedTubes?: string[];
};

export type PneumaticComponentState =
  | PneumaticSplitterState
  | PneumaticCompressorState
  | PneumaticButtonState
  | PneumaticCylinderState;

export type PneumapicTubeState = {
  id: string;
  from: string | "atmosphere";
  to: string | "atmosphere";
  residualMass: number;
};

export type PneumaticState = {
  components: { [id: string]: PneumaticComponentState };
  tubes: { [id: string]: PneumapicTubeState };
};
