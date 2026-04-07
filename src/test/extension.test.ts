import * as assert from 'assert';
import * as vscode from 'vscode';
import { isValidHexColor, vscodeColorToHex, DEFAULT_ERROR_HEX } from '../test/colors';

suite('Color Utilities', () => {

  test('isValidHexColor accepts valid 6-digit hex', () => {
    assert.strictEqual(isValidHexColor('#FF0000'), true);
  });

  test('isValidHexColor accepts valid 8-digit hex', () => {
    assert.strictEqual(isValidHexColor('#FF0000FF'), true);
  });

  test('isValidHexColor rejects invalid input', () => {
    assert.strictEqual(isValidHexColor('not-a-color'), false);
    assert.strictEqual(isValidHexColor('#ZZZ'), false);
  });

  test('vscodeColorToHex defaults to the normal error color', () => {
    const color = new vscode.Color(0xD8/255, 0x1B/255, 0x60/255, 1);
    assert.strictEqual(vscodeColorToHex(color), DEFAULT_ERROR_HEX);
  });

});
