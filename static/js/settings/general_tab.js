class GeneralTab extends AbstractSettingsTab {

  constructor () {
    super();
  }

  createContent() {
    let content;
    content = document.createElement('div');
    content.setAttribute('class', 'settings-tab-content');
    content.textContent = "TODO: Some General Settings?";
    return content;
  }
}