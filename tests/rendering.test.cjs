const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Exercise the production renderers without loading the browser application.
const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const context = vm.createContext({
  escapeHtml: value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]))
});
vm.runInContext(source.slice(source.indexOf('    function formatAnswerCardHtml('), source.indexOf('    function renderStudy()')), context);
const { formatQuestionHtml, formatRichTextHtml, formatAnswerCardHtml, splitQuestionOptions, extractChoiceBank, isMarkdownTable, splitTableRow } = context;

const blanks = '사업주가 설치해야 할 추락방호망의 ( ) 안에 알맞은 답을 넣으시오.\n추락방호망은 작업면에 가까운 지점에 설치하며, 수직거리는 ( 1) m를 초과하지 않아야 한다.\n망의 처짐은 짧은 변 길이의 ( 2) % 이상이 되도록 한다.\n내민 길이는 벽면으로부터 ( 3) m 이상이어야 한다.';
assert.equal(splitQuestionOptions(blanks).options.length, 0);
assert(!formatQuestionHtml(blanks).includes('question-option'));
assert(formatQuestionHtml(blanks).includes('( 1)'));
assert.equal(splitQuestionOptions('질문\r\n1. 첫째\r\n2. 둘째\r\n3. 셋째').options.length, 3);
assert.equal(splitQuestionOptions('질문 ①첫째 ②둘째 ③셋째 ④넷째').options.length, 4);
assert.equal(splitQuestionOptions('1.5 m\n2.5 m\n3.5 m').options.length, 0);
assert.equal(splitQuestionOptions('질문\n1. 첫째\n추가 설명\n2. 둘째\n3. 셋째').options[0].text, '첫째\n추가 설명');

const table = '| 항목 | 기준 |\n| --- | --- |\n| 높이 | **3 m** |';
const mixed = `조건을 확인하세요.\n${table}\n알맞은 답을 쓰시오.`;
for (const html of [formatQuestionHtml(mixed), formatQuestionHtml(`[박스]\n${mixed}\n[/박스]`), formatQuestionHtml(`[보기]\n${table}\n[/보기]`), formatAnswerCardHtml({ answer: mixed }), formatAnswerCardHtml({ answer: `정답:\n${table}` })]) {
  assert(html.includes('<table'), html);
  assert(html.includes('<strong'), html);
}
assert(!isMarkdownTable('| 항목 | 기준 |\n| --- | 잘못된 구분선 |'));
assert.equal(splitTableRow('| A\\|B | C |')[0], 'A|B');
assert(formatRichTextHtml('| A | B |\n| --- | --- |\n| 1 | 2 | 누락 방지 |').includes('누락 방지'));
assert.equal(extractChoiceBank('[보기]\n1. 항목 하나\n2. 항목 둘\n[/보기]\n질문').items.length, 2);
assert.equal(extractChoiceBank('[보기]\n도구, 장비\n안전시설\n[/보기]').items[0], '도구, 장비');
assert.equal((formatQuestionHtml(`[보기]\n${table}\n[/보기]`).match(/<table/g) || []).length, 1);
assert(!extractChoiceBank('[보기] 가, 나 [/보기]').items.join('').includes('[/보기]'));
assert(!formatRichTextHtml('본문\n1. 설명\n후속 문장').includes('<ol'));
assert(!formatQuestionHtml(`질문\n${table.replace('높이', '1. 높이')}`).includes('question-option'));
console.log('PASS: blank labels, choices, CRLF, decimals, tables in prose/boxes/answers, escaped pipes, preserved columns and commas');
