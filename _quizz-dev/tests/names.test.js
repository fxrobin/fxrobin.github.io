import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanName, nameKey, validateName, NAME_TAKEN } from '../../quizz/js/names.js';

test('nameKey_normalizes', () => {
  assert.equal(nameKey('Léa'), 'lea');
  assert.equal(nameKey(' lea '), 'lea');
  assert.equal(nameKey('LÉA'), 'lea');
  assert.equal(nameKey('Thomas B'), 'thomas-b');
  assert.equal(nameKey('Jean-Noël'), 'jean-noel');
  assert.equal(nameKey('Zoé.'), 'zoe');
});

test('validateName_messages', () => {
  assert.equal(validateName(''), 'Écris ton prénom.');
  assert.equal(validateName('   '), 'Écris ton prénom.');
  assert.equal(validateName('1234'), 'Ton prénom doit contenir au moins une lettre.');
  assert.equal(validateName('Inès'), null);
});

test('cleanName_trims', () => {
  assert.equal(cleanName('  Thomas   B  '), 'Thomas B');
  assert.equal(cleanName('a'.repeat(30)).length, 20);
});

test('NAME_TAKEN_text', () => {
  assert.equal(NAME_TAKEN, "Ce prénom est déjà pris : ajoute l'initiale de ton nom.");
});

test('validateName_requires_latin_letters_for_key', () => {
  assert.equal(validateName('王芳'), 'Écris ton prénom en lettres latines.');
  assert.equal(validateName('Ольга'), 'Écris ton prénom en lettres latines.');
  assert.equal(validateName('Ægir'), null);
  assert.equal(nameKey('Ægir'), 'aegir');
  assert.equal(nameKey('Łukasz'), 'lukasz');
});
