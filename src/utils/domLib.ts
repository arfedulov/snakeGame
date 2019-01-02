export function insertElements(parent: HTMLElement,
                               content: string[],
                               type = 'div',
                               replace=true): void {
  if (replace && content.length > 0) {
    parent.innerHTML = '';
  }
  content.forEach((elCont) => {
    const el = document.createElement(type);
    el.innerText = elCont;
    parent.appendChild(el);
  });
}

export default {
  insertElements,
};
