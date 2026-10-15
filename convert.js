const TONARIHE = "move!!";
const PARAM_SPLIT_REGIX = /[ー\-@＠]/
const BORDER_COLOR = "#000";
const FILL_COLOR = "transparent";
const TEXT_COLOR = "#000";
const SIZES = Object.freeze({
  section: 40,
  small: 35,
  inside: 20,
  height: 40,
  border: 2
});
const WIDTHES = Object.freeze({
  small: SIZES.height * 1.5,
  medium: SIZES.height * 4,
  large: SIZES.height * 6
});
const FONTSIZES = Object.freeze({
  section: 20,
  small: 14,
  inside: 14
});
const STROKE_DATA = {
  color: BORDER_COLOR,
  width: SIZES.border
};
const STROKE_DASHARRAY = "3";
const MAX_WIDTH = SIZES.section + SIZES.small + SIZES.inside + WIDTHES.large + SIZES.border + SIZES.inside;


let secMaxX = 0;
/**
 * 
 * @param {import("@svgdotjs/svg.js").Svg} svg 
 * @param {[number, number]} location 
 * @param {[number, number]} size 
 * @param {string?} text 
 * @param {number?} fontSize 
 * @returns 
 */
function rect(svg, location, size, text, fontSize) {
  if (text) {
    const t = svg.text(text).fill(TEXT_COLOR).font({
      size: fontSize
    });
    const box = t.bbox();
    const w = box.w;
    const h = box.h;
    t.move(location[0] + (size[0]/2) - (w/2), location[1] + (size[1]/2) - (h/2));
  }

  // console.log(location[0]+size[0] >= 2000 ? [location, size, text, fontSize]:undefined)
  secMaxX = Math.max(location[0]+size[0], secMaxX);

  return svg.rect(...size).stroke(STROKE_DATA).fill(FILL_COLOR).move(...location);
}
function getWidthFromParam(param) {
  if (!param) return WIDTHES.medium;

  if (param == "小") return WIDTHES.small;
  if (param == "s") return WIDTHES.small;
  if (param == "中") return WIDTHES.medium;
  if (param == "m") return WIDTHES.medium;
  if (param == "大") return WIDTHES.large;
  if (param == "l") return WIDTHES.large;
  if (isKijutsu(param)) return WIDTHES.large;

  // alert("文字サイズ:"+param+"は知りません");

  return WIDTHES.medium;
}
function isKijutsu(param) {
  return param?.startsWith("記述");
}
function convert(txt) {
  /**@type {import("@svgdotjs/svg.js").Svg} */
  const result = SVG();
  result.width(1000).height(500)

  /**@type {string[]} */
  const lines = txt.split(/[\n\r]/g).filter(e => e != "");

  /**@type {{title: string, items: ({q: number, param: undefined | string}|{q: number, children: {inside: string, param: undefined | string}[]})[]}[]} */
  const sections = [];
  let currentSection = null;
  let sectionList = null;

  function resetSectionIfPossible() {
    if (currentSection) {
      const newQTable = {};
      for (const item of sectionList) {
        if (item[2] != undefined) {
          if (newQTable[item[0]]) {
            newQTable[item[0]].children.push({
              inside: item[2],
              param: item[1]
            });
          } else {
            newQTable[item[0]] = {
              q: item[0],
              children: [{
                inside: item[2],
                param: item[1]
              }]
            }
          }
        } else {
          newQTable[item[0]] = {
            q: item[0],
            param: item[1]
          };
        }
      }

      const newQ = Object.keys(newQTable).map(e => Number(e)).toSorted((a, b) => a - b).map(key => newQTable[key]);
      sections.push({
        title: currentSection,
        items: newQ
      });
    }
  }

  let lastSmall = null;
  for (const line of lines) {
    if (line.match("となりへ") || line == "ずらしてよ！") {
      resetSectionIfPossible();
      currentSection = null;
      sectionList = [];
      lastSmall = null;

      sections.push(TONARIHE);
      continue;
    }
    if (line.startsWith("大問")) {
      resetSectionIfPossible();
      currentSection = line.replace("大問", "");
      sectionList = [];
      lastSmall = null;

      continue;
    }
    if (line.match(/^\(?[0-9]+\)/)) {
      const match = line.match(/^\(?([0-9]+)\)/);
      const inside = line.replace(match[0], "").split(PARAM_SPLIT_REGIX)[0];
      const afterAt = line.split(PARAM_SPLIT_REGIX)[1];
      lastSmall = Number(match[1]);
      sectionList?.push([Number(match[1]), afterAt, ...(inside == "" ? [] : [inside])]);

      continue;
    }
    if (lastSmall != null) {
      const splitted = line.split(PARAM_SPLIT_REGIX);
      const inside = splitted[0];
      const afterAt = splitted[1];
      sectionList?.push([lastSmall, afterAt, ...(inside == "" ? [] : [inside])]);

      continue;
    }
  }
  resetSectionIfPossible();

  let maxYSum = 0;

  let ySum = SIZES.border / 2;
  let zurashiX = 0;
  secMaxX = 0;
  for (const sec of sections) {
    // console.log(sec);
    if (sec == TONARIHE) {
      maxYSum = Math.max(ySum, maxYSum);
      ySum = SIZES.border / 2;
      // console.log(secMaxX, zurashiX);
      // console.log(secMaxX - zurashiX);
      zurashiX += (secMaxX - zurashiX) + SIZES.inside;
      secMaxX = 0;
      continue;
    }



    /**@type {import("@svgdotjs/svg.js").Svg} */
    const r = result.nested();
    
    const baseY = SIZES.border / 2;
    let y = 0;
    const baseX = zurashiX + SIZES.section + 1;

    for (const q of sec.items) {
      if (q.children) {
        const beforeY = y;
        for (const child of q.children) {
          if (isKijutsu(child.param)) {
            const num = Number(child.param.replace("記述", ""));
            // ①みたいな
            rect(r, [baseX + SIZES.small, baseY + y], [SIZES.inside, SIZES.height * num], child.inside, FONTSIZES.inside);
            // 解答枠
            rect(r, [baseX + SIZES.small + SIZES.inside, baseY + y], [getWidthFromParam(child.param), SIZES.height * num]);
            for (let i = 0; i < num - 1; i ++) {
              // 点線
              r.line([baseX + SIZES.small + SIZES.inside, baseY + y + (i + 1) * SIZES.height, baseX + SIZES.small + SIZES.inside + getWidthFromParam(child.param), baseY + y + (i + 1) * SIZES.height]).fill(FILL_COLOR).stroke({
                ...STROKE_DATA,
                dasharray: STROKE_DASHARRAY
              });
            }
            y += SIZES.height * num;
          } else {
            rect(r, [baseX + SIZES.small, baseY + y], [SIZES.inside, SIZES.height], child.inside, FONTSIZES.inside);
            rect(r, [baseX + SIZES.small + SIZES.inside, baseY + y], [getWidthFromParam(child.param), SIZES.height]);
            y += SIZES.height;
          }
        }
        rect(r, [baseX, baseY + beforeY], [SIZES.small, y - beforeY], "("+q.q+")", FONTSIZES.small);
      } else {
        if (isKijutsu(q.param)) {
          const num = Number(q.param.replace("記述", ""));
          // (1)みたいな
          rect(r, [baseX, baseY + y], [SIZES.small, SIZES.height * num], "("+q.q+")", FONTSIZES.small);
          // 解答枠
          rect(r, [baseX + SIZES.small, baseY + y], [getWidthFromParam(q.param), SIZES.height * num]);
          for (let i = 0; i < num - 1; i ++) {
            // 点線
            r.line([baseX + SIZES.small, baseY + y + (i + 1) * SIZES.height, baseX + SIZES.small + getWidthFromParam(q.param), baseY + y + (i + 1) * SIZES.height]).fill(FILL_COLOR).stroke({
              ...STROKE_DATA,
              dasharray: STROKE_DASHARRAY
            });
          }
          y += SIZES.height * num;
        } else {
          rect(r, [baseX, baseY + y], [SIZES.small, SIZES.height], "("+q.q+")", FONTSIZES.small);
          rect(r, [baseX + SIZES.small, baseY + y], [getWidthFromParam(q.param), SIZES.height]);
          y += SIZES.height;
        }
      }
    }

    rect(r, [baseX - SIZES.section, baseY], [SIZES.section, y], sec.title, FONTSIZES.section);

    r.move(SIZES.border / 2, ySum);
    ySum += y + SIZES.section / 2;

  }
  maxYSum = Math.max(ySum, maxYSum);
  
  zurashiX += secMaxX - zurashiX + SIZES.border + 1;

  result.height(maxYSum);
  result.width(zurashiX);
  return [result, maxYSum, zurashiX];
}




function convert2png(svg, w, h) {

  return new Promise(resolve => {

    
    // https://qiita.com/shikuno_dev/items/bdc013c602645b07c047

    const svgDataBase64 = btoa(unescape(encodeURIComponent(svg)))
    // console.log(svgDataBase64);

    const svgDataUrl = `data:image/svg+xml;charset=utf-8;base64,${svgDataBase64}`
    // console.log(svgDataUrl);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // 高解像度設定
    canvas.width = w * 2;
    canvas.height = h * 2;

    const img = new Image();
    img.addEventListener("load", () => {
      context.drawImage(img, 0, 0, w * 2, h * 2);

      const res = canvas.toDataURL("image/png");
      resolve(res);
    });
    img.src = svgDataUrl;
  });
}