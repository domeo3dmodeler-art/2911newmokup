/**
 * Точечная привязка: модель + тип покрытия + цвет/отделка → файл в public/uploads/final-filled/Цвет
 * Данные с скрина (в 1002/final_filled 30.01.xlsx столбца «файл» нет).
 */
export const COLOR_FOLDER_BINDINGS: Array<{
  modelName: string;
  coatingType: string;
  colorName: string;
  file: string;
}> = [
  { modelName: 'Дверное полотно Rimini 12 ПО', coatingType: 'Эмаль', colorName: 'Белоснежный', file: 'Pearl_7_Белоснежный.png' },
  { modelName: 'Дверное полотно Rimini 12 ПО', coatingType: 'Эмаль', colorName: 'Телегрей (RAL 7047)', file: 'Pearl_7_телегрей.png' },
  { modelName: 'Дверное полотно Rimini 12 ПО', coatingType: 'Эмаль', colorName: 'Кремово-белый', file: 'Pearl_7_Кремово-белый.png' },
  { modelName: 'Дверное полотно Rimini 2 ПО', coatingType: 'Эмаль', colorName: 'Белоснежный', file: 'Pearl_6_Белоснежный.png' },
  { modelName: 'Дверное полотно Rimini 2 ПО', coatingType: 'Эмаль', colorName: 'Телегрей (RAL 7047)', file: 'Pearl_6_Телегрей (RAL 7047).png' },
  { modelName: 'Дверное полотно Rimini 2 ПО', coatingType: 'Эмаль', colorName: 'Кремово-белый', file: 'Pearl_6_Кремово-белый.png' },
  { modelName: 'Дверь Enigma 2 ДГ', coatingType: 'Эмаль', colorName: 'Синий (NCS S 6010-B10G)', file: 'Quantum_6_Синий (NCS S 6010-B10G).PNG' },
  { modelName: 'Дверь Molis 1 эмаль ДГ', coatingType: 'Эмаль', colorName: 'Белый (RAL 9003)', file: 'Meteor_1_Белый (RAL 9003).png' },
  { modelName: 'Дверь Molis 1 эмаль ДГ', coatingType: 'Эмаль', colorName: 'Агат (Ral 7038)', file: 'Meteor_1_Агат (Ral 7038).png' },
  { modelName: 'Дверь Molis 1 эмаль ДГ', coatingType: 'Эмаль', colorName: 'Белый (RAL 9010)', file: 'Meteor_1_Белый (RAL 9010).png' },
];
