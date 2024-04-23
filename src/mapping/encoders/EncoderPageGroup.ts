import { EncoderMappingConfig } from "./EncoderMapper";
import { EncoderMappingDependencies, EncoderPage, EncoderPageConfig } from "./EncoderPage";
import { LedButton } from "/decorators/surface-elements/LedButton";
import { ContextVariable } from "/util";

export class EncoderPageGroup {
  private static activeInstance = new ContextVariable<EncoderPageGroup | undefined>(undefined);

  private activeEncoderPage = new ContextVariable<EncoderPage | undefined>(undefined);
  private activatorButtons: LedButton[];

  constructor(
    private dependencies: EncoderMappingDependencies,
    config: EncoderMappingConfig,
  ) {
    this.activatorButtons = dependencies.mainDevices.map(config.activatorButtonSelector);
    const encoderPages = this.createEncoderPages(
      this.splitEncoderPageConfigs(config.pages),
      this.activatorButtons,
    );
    this.bindEncoderPagesToActivatorButtons(encoderPages);

    if (config.enhanceMapping) {
      config.enhanceMapping(encoderPages, this.activatorButtons);
    }
  }

  /**
   * Takes an array of `EncoderPageConfig`s, splits all pages with more encoder assignments than
   * physical encoders into multiple pages and returns the resulting page config array.
   */
  private splitEncoderPageConfigs(pages: EncoderPageConfig[]) {
    const encoderPageSize = this.dependencies.channelElements.length;

    return pages.flatMap((page) => {
      const assignments = page.assignments;
      if (Array.isArray(assignments) && assignments.length > encoderPageSize) {
        const chunks = [];
        for (let i = 0; i < assignments.length / encoderPageSize; i++) {
          chunks.push(assignments.slice(i * encoderPageSize, (i + 1) * encoderPageSize));
        }
        return chunks.map((chunk) => ({
          ...page,
          assignments: chunk,
        }));
      }

      return page;
    });
  }

  /**
   * Given a list of `EncoderPageConfig`s and the button(s) that cycle through the encoder pages,
   * this method creates `EncoderPage`s for them and returns the resulting list of encoder pages.
   */
  private createEncoderPages(pageConfigs: EncoderPageConfig[], activatorButtons: LedButton[]) {
    return pageConfigs.map((pageConfig, pageIndex) => {
      return new EncoderPage(
        this,
        this.dependencies,
        pageConfig,
        activatorButtons,
        pageIndex,
        pageConfigs.length,
      );
    });
  }

  private bindEncoderPagesToActivatorButtons(encoderPages: EncoderPage[]) {
    // Bind encoder assign buttons to cycle through sub pages in a round-robin fashion
    for (const activatorButton of this.activatorButtons) {
      const activatorButtonValue = activatorButton.mSurfaceValue;
      this.dependencies.page.makeActionBinding(
        activatorButtonValue,
        encoderPages[0].subPages.default.mAction.mActivate,
      );

      let previousSubPages = encoderPages[0].subPages;
      for (const { subPages: currentSubPages } of encoderPages) {
        this.dependencies.page
          .makeActionBinding(activatorButtonValue, currentSubPages.default.mAction.mActivate)
          .setSubPage(previousSubPages.default);
        this.dependencies.page
          .makeActionBinding(activatorButtonValue, currentSubPages.default.mAction.mActivate)
          .setSubPage(previousSubPages.flip);

        previousSubPages = currentSubPages;
      }
    }
  }

  private setActivatorButtonLeds(context: MR_ActiveDevice, value: number) {
    for (const button of this.activatorButtons) {
      button.setLedValue(context, value);
    }
  }

  /**
   * This is invoked by an {@link EncoderPage} when one of its subpages gets activated. It keeps
   * track of the currently active `EncoderPage` and `EncoderPageGroup` and runs their
   * (de)activation callbacks.
   */
  onEncoderPageSubPageActivated(context: MR_ActiveDevice, encoderPage: EncoderPage) {
    const lastActiveEncoderPageGroup = EncoderPageGroup.activeInstance.get(context);
    if (lastActiveEncoderPageGroup !== this) {
      lastActiveEncoderPageGroup?.onDeactivated(context);
      EncoderPageGroup.activeInstance.set(context, this);
      this.onActivated(context);
    }

    const lastActiveEncoderPage = this.activeEncoderPage.get(context);
    if (lastActiveEncoderPage !== encoderPage) {
      lastActiveEncoderPage?.onDeactivated(context);
      this.activeEncoderPage.set(context, encoderPage);
      encoderPage.onActivated(context);
    }
  }

  onActivated(context: MR_ActiveDevice) {
    this.setActivatorButtonLeds(context, 1);
  }

  /**
   * This is invoked when another `EncoderGroup` is activated.
   */
  onDeactivated(context: MR_ActiveDevice) {
    this.activeEncoderPage.get(context)?.onDeactivated(context);
    this.activeEncoderPage.set(context, undefined);

    this.setActivatorButtonLeds(context, 0);
  }
}
