import { EncoderMapper, EncoderMappingConfig } from "./EncoderMapper";
import * as pageConfigs from "./page-configs";
import { deviceConfig } from "/config";
import { Device, MainDevice } from "/devices";
import { SegmentDisplayManager } from "/midi/managers/SegmentDisplayManager";
import { GlobalState } from "/state";

export function bindEncoders(
  page: MR_FactoryMappingPage,
  devices: Device[],
  mixerBankChannels: MR_MixerBankChannel[],
  segmentDisplayManager: SegmentDisplayManager,
  globalState: GlobalState,
) {
  const encoderMapper = new EncoderMapper(
    page,
    devices,
    mixerBankChannels,
    segmentDisplayManager,
    globalState,
  );

  const selectAssignButtons = (device: MainDevice) =>
    device.controlSectionElements.buttons.encoderAssign;

  const hostAccess = page.mHostAccess;

  let encoderMappingConfigs: EncoderMappingConfig[] = [
    // Pan (Defining Pan first so it is activated by default)
    {
      activatorButtonSelector: (device) => selectAssignButtons(device).pan,
      pages: [pageConfigs.pan],
    },

    // Track
    {
      activatorButtonSelector: (device) => selectAssignButtons(device).track,
      pages: [
        pageConfigs.monitor,
        pageConfigs.inputGain,
        pageConfigs.inputPhase,
        pageConfigs.lowCut,
        pageConfigs.highCut,
        pageConfigs.trackQuickControls(hostAccess),
      ],
    },

    // EQ
    {
      activatorButtonSelector: (device) => selectAssignButtons(device).eq,
      pages: [pageConfigs.eq(hostAccess)],
    },

    // Send
    {
      activatorButtonSelector: (device) => selectAssignButtons(device).send,
      pages: [pageConfigs.sends(hostAccess)],
    },

    // Plug-In
    pageConfigs.pluginMappingConfig(page, (device) => selectAssignButtons(device).send),

    // Instrument
    {
      activatorButtonSelector: (device) => selectAssignButtons(device).instrument,
      pages: [pageConfigs.vstQuickControls(hostAccess), pageConfigs.stripEffects(hostAccess)],
    },
  ];

  if (deviceConfig.configureEncoderMapping) {
    encoderMappingConfigs = deviceConfig.configureEncoderMapping(encoderMappingConfigs, page);
  }

  encoderMapper.applyEncoderMappingConfigs(encoderMappingConfigs);
}
