import {
  PneumaticComponentState,
  PneumapicTubeState,
  PneumaticCompressorState,
  PneumaticButtonState,
  PneumaticCylinderState,
  PneumaticSplitterState,
} from "@/types/PneumaticTypes";

export function findTubeAttachedToComponent(
  componentId: string,
  terminalId: string,
  tubes: PneumapicTubeState[]
) {
  const attachedTubes: PneumapicTubeState[] = [];

  tubes.forEach((tube) => {
    if (tube.from === `${componentId}/${terminalId}`) {
      attachedTubes.push(tube);
    }
    if (tube.to === `${componentId}/${terminalId}`) {
      attachedTubes.push(tube);
    }
  });

  return attachedTubes;
}

export function residualMassToPressure(residualMass: number) {
  return Math.max(0, residualMass);
}

export function iterateSimulation(
  pneumaticComponents: PneumaticComponentState[],
  pneumaticTubes: PneumapicTubeState[]
) {
  console.log(pneumaticComponents);

  // Clear all pipes connected to atmosphere
  pneumaticTubes.forEach((tube) => {
    if (tube.from === "atmosphere" || tube.to === "atmosphere") {
      tube.residualMass = 0;
    }
  });

  pneumaticComponents.forEach((component) => {
    if (component._kind === "compressor") {
      const compressor = component as PneumaticCompressorState;

      const tubesAtTerminal1 = findTubeAttachedToComponent(
        component._id,
        "1",
        pneumaticTubes
      );

      let tube: PneumapicTubeState = {
        id: "atmosphere",
        from: "atmosphere",
        to: "atmosphere",
        residualMass: 0,
      };

      if (tubesAtTerminal1.length > 1) {
        compressor.alert = "Multiple tubes connected to terminal 1";
        return;
      } else if (tubesAtTerminal1.length === 0) {
        compressor.alert = "No tubes connected to terminal 1";
      } else {
        compressor.alert = null;
        tube = tubesAtTerminal1[0];
      }

      const pressure = residualMassToPressure(tube.residualMass);
      compressor.terminalPressures[1] = pressure;

      const supplyPressure = 3;
      const pressureDifference = supplyPressure - pressure;

      if (pressureDifference > 0) {
        tube.residualMass += pressureDifference * 0.3;
      }
    } else if (component._kind === "button") {
      const button = component as PneumaticButtonState;

      const tubesAtTerminal1 = findTubeAttachedToComponent(
        component._id,
        "1",
        pneumaticTubes
      );
      const tubesAtTerminal2 = findTubeAttachedToComponent(
        component._id,
        "2",
        pneumaticTubes
      );
      const tubesAtTerminal3 = findTubeAttachedToComponent(
        component._id,
        "3",
        pneumaticTubes
      );
      const tubesAtTerminal4 = findTubeAttachedToComponent(
        component._id,
        "4",
        pneumaticTubes
      );

      let tube1: PneumapicTubeState = {
        id: "atmosphere",
        from: "atmosphere",
        to: "atmosphere",
        residualMass: 0,
      };

      let tube2: PneumapicTubeState = {
        id: "atmosphere",
        from: "atmosphere",
        to: "atmosphere",
        residualMass: 0,
      };

      let tube3: PneumapicTubeState = {
        id: "atmosphere",
        from: "atmosphere",
        to: "atmosphere",
        residualMass: 0,
      };

      let tube4: PneumapicTubeState = {
        id: "atmosphere",
        from: "atmosphere",
        to: "atmosphere",
        residualMass: 0,
      };

      if (tubesAtTerminal1.length > 1) {
        button.alert = "Multiple tubes connected to terminal 1";
        return;
      } else if (tubesAtTerminal1.length === 0) {
        button.alert = "No tubes connected to terminal 1";
      } else {
        button.alert = null;
        tube1 = tubesAtTerminal1[0];
      }

      if (tubesAtTerminal2.length > 1) {
        button.alert = "Multiple tubes connected to terminal 2";
        return;
      } else if (tubesAtTerminal2.length === 0) {
        button.alert = "No tubes connected to terminal 2";
      } else {
        button.alert = null;
        tube2 = tubesAtTerminal2[0];
      }

      if (tubesAtTerminal3.length > 1) {
        button.alert = "Multiple tubes connected to terminal 3";
        return;
      } else if (tubesAtTerminal3.length === 0) {
        button.alert = "No tubes connected to terminal 3";
      } else {
        button.alert = null;
        tube3 = tubesAtTerminal3[0];
      }

      if (tubesAtTerminal4.length > 1) {
        button.alert = "Multiple tubes connected to terminal 4";
        return;
      } else if (tubesAtTerminal4.length === 0) {
        button.alert = "No tubes connected to terminal 4";
      } else {
        button.alert = null;
        tube4 = tubesAtTerminal4[0];
      }

      const pressure1 = residualMassToPressure(tube1.residualMass);
      const pressure2 = residualMassToPressure(tube2.residualMass);

      const pressureDifference12 = pressure1 - pressure2;

      const pressure3 = residualMassToPressure(tube3.residualMass);
      const pressure4 = residualMassToPressure(tube4.residualMass);

      const pressureDifference34 = pressure3 - pressure4;

      button.terminalPressures[1] = pressure1;
      button.terminalPressures[2] = pressure2;
      button.terminalPressures[3] = pressure3;
      button.terminalPressures[4] = pressure4;

      if (button.leftPressed) {
        tube1.residualMass += -pressureDifference12 * 0.3;
        tube2.residualMass += pressureDifference12 * 0.3;
      } else {
        tube2.residualMass += -pressure2 * 0.3;
      }

      if (button.rightPressed) {
        tube3.residualMass += -pressureDifference34 * 0.3;
        tube4.residualMass += pressureDifference34 * 0.3;
      } else {
        tube4.residualMass += -pressure4 * 0.3;
      }
    } else if (component._kind === "cylinder") {
      const cylinder = component as PneumaticCylinderState;

      const tubesAtTerminal1 = findTubeAttachedToComponent(
        component._id,
        "1",
        pneumaticTubes
      );

      let tube: PneumapicTubeState = {
        id: "atmosphere",
        from: "atmosphere",
        to: "atmosphere",
        residualMass: 0,
      };

      if (tubesAtTerminal1.length > 1) {
        cylinder.alert = "Multiple tubes connected to terminal 1";
        return;
      } else if (tubesAtTerminal1.length === 0) {
        cylinder.alert = "No tubes connected to terminal 1";
      } else {
        cylinder.alert = null;
        tube = tubesAtTerminal1[0];
      }

      const pressure = residualMassToPressure(tube.residualMass);

      cylinder.terminalPressures[1] = pressure;

      // Set expansion proportional to pressure
      cylinder.expansion = pressure / 1.5;
    } else if (component._kind === "splitter") {
      const splitter = component as PneumaticSplitterState;

      const tubesAtTerminal1 = findTubeAttachedToComponent(
        component._id,
        "1",
        pneumaticTubes
      );
      const tubesAtTerminal2 = findTubeAttachedToComponent(
        component._id,
        "2",
        pneumaticTubes
      );
      const tubesAtTerminal3 = findTubeAttachedToComponent(
        component._id,
        "3",
        pneumaticTubes
      );

      let tube1: PneumapicTubeState = {
        id: "atmosphere",
        from: "atmosphere",
        to: "atmosphere",
        residualMass: 0,
      };

      let tube2: PneumapicTubeState = {
        id: "atmosphere",
        from: "atmosphere",
        to: "atmosphere",
        residualMass: 0,
      };

      let tube3: PneumapicTubeState = {
        id: "atmosphere",
        from: "atmosphere",
        to: "atmosphere",
        residualMass: 0,
      };

      if (tubesAtTerminal1.length > 1) {
        splitter.alert = "Multiple tubes connected to terminal 1";
        return;
      } else if (tubesAtTerminal1.length === 0) {
        splitter.alert = "No tubes connected to terminal 1";
      } else {
        splitter.alert = null;
        tube1 = tubesAtTerminal1[0];
      }

      if (tubesAtTerminal2.length > 1) {
        splitter.alert = "Multiple tubes connected to terminal 2";
        return;
      } else if (tubesAtTerminal2.length === 0) {
        splitter.alert = "No tubes connected to terminal 2";
      } else {
        splitter.alert = null;
        tube2 = tubesAtTerminal2[0];
      }

      if (tubesAtTerminal3.length > 1) {
        splitter.alert = "Multiple tubes connected to terminal 3";
        return;
      } else if (tubesAtTerminal3.length === 0) {
        splitter.alert = "No tubes connected to terminal 3";
      } else {
        splitter.alert = null;
        tube3 = tubesAtTerminal3[0];
      }

      const pressure1 = residualMassToPressure(tube1.residualMass);
      const pressure2 = residualMassToPressure(tube2.residualMass);
      const pressure3 = residualMassToPressure(tube3.residualMass);

      splitter.terminalPressures[1] = pressure1;
      splitter.terminalPressures[2] = pressure2;
      splitter.terminalPressures[3] = pressure3;

      const pressureDifference12 = pressure1 - pressure2;
      const pressureDifference23 = pressure2 - pressure3;
      const pressureDifference13 = pressure1 - pressure3;

      tube1.residualMass += -pressureDifference12 * 0.3;
      tube2.residualMass += pressureDifference12 * 0.3;

      tube2.residualMass += -pressureDifference23 * 0.3;
      tube3.residualMass += pressureDifference23 * 0.3;

      tube1.residualMass += -pressureDifference13 * 0.3;
      tube3.residualMass += pressureDifference13 * 0.3;
    }
  });
}
