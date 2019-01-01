export function insertElements(parent: HTMLElement,
                               content: string[],
                               type = 'div'): void {
  content.forEach((elCont) => {
    const el = document.createElement(type);
    el.innerText = elCont;
    parent.appendChild(el);
  });
}

export default {
  insertElements,
};
