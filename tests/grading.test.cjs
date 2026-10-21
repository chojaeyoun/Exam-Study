const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Exercise the production answer comparison without loading the browser application.
const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const context = vm.createContext({});
vm.runInContext(source.slice(source.indexOf('    function compactText('), source.indexOf('    function answerNumberTokens(')), context);
const { answerIncludes } = context;

// 쉼표·조사(의/에/에서/을/를)·및/등이 빠지거나 바뀌어도 맞음
assert(answerIncludes('작업장 안전관리', '작업장의 안전관리'));
assert(answerIncludes('작업장안전관리', '작업장의 안전관리'));
assert(answerIncludes('작업장에 안전관리', '작업장의 안전관리'));
assert(answerIncludes('안전모 안전대 안전화', '안전모, 안전대 및 안전화'));
assert(answerIncludes('근로자를 보호한다', '근로자 보호한다'));
assert(answerIncludes('추락 방지(방호망 설치)', '추락 방지 방호망 설치'));
// 단어 안의 '의'·'에'는 그대로: 의사, 에너지
assert(!answerIncludes('에너', '에너지'));
assert(answerIncludes('전기 에너지', '전기에너지'));
// 다른 내용은 여전히 틀림
assert(!answerIncludes('작업장 환기', '작업장의 안전관리'));
// 조사를 빼면 한 글자만 남는 표현은 느슨하게 보지 않음 ('주의' -> '주')
assert(!answerIncludes('주간 점검', '주의'));
console.log('PASS: punctuation, particles 의/에/에서/을/를, 및/등 ignored; real differences still fail');
