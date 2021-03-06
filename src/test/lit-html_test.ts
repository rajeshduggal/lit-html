/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/chai/index.d.ts" />

import {html, TemplateResult, TemplatePart, TemplateInstance, NodePart, Part, AttributePart, Template} from '../lit-html.js';

const assert = chai.assert;

suite('lit-html', () => {

  suite('html', () => {

    test('returns a TemplateResult', () => {
      assert.instanceOf(html``, TemplateResult);
    });

    test('templates are identical for multiple calls', () => {
      const t = () => html``;
      assert.strictEqual(t().template, t().template);
    });

    test('values contain interpolated values', () => {
      const foo = 'foo', bar = 1;
      assert.deepEqual(html`${foo}${bar}`.values, [foo, bar]);
    });

    test('parses parts for multiple expressions', () => {
      const result = html`
        <div a="${1}">
          <p>${2}</p>
          ${3}
          <span a="${4}">${5}</span>
        </div>`;
      const parts = result.template.parts;
      assert.equal(parts.length, 5);
    });

    test('stores raw names of attributes', () => {
      const result = html`
        <div 
          someProp="${1}"
          a-nother="${2}"
          multiParts='${3} ${4}'>
          <p>${5}</p>
          <div aThing="${6}"></div>
        </div>`;
      const parts = result.template.parts;
      const names = parts.map((p: TemplatePart) => p.name);
      const rawNames = parts.map((p: TemplatePart) => p.rawName);
      assert.deepEqual(names, ['someprop', 'a-nother', 'multiparts', undefined, 'athing']);
      assert.deepEqual(rawNames, ['someProp', 'a-nother', 'multiParts', undefined, 'aThing']);
    });

    test('parses expressions for two attributes of one element', () => {
      const result = html`<div a="${1}" b="${2}"></div>`;
      const parts = result.template.parts;
      assert.equal(parts.length, 2);
      const instance = new TemplateInstance(result.template);
      instance._clone();
      assert.equal(instance._parts.length, 2);
    });

    test('updates when called multiple times with arrays', () => {
      const container = document.createElement('div');
      const ul = (list: string[]) => {
        var items = list.map(item => html`<li>${item}</li>`);
        return html`<ul>${items}</ul>`;
      };
      ul(['a', 'b', 'c']).renderTo(container);
      assert.equal(container.innerHTML, '<ul><li>a</li><li>b</li><li>c</li></ul>');
      ul(['x', 'y']).renderTo(container);
      assert.equal(container.innerHTML, '<ul><li>x</li><li>y</li></ul>');
    });

  });

  suite('TemplateResult', () => {

    suite('first render', () => {

      test('renders a string', () => {
        const container = document.createElement('div');
        html`<div>${'foo'}</div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div>foo</div>');
      });

      test('renders a number', () => {
        const container = document.createElement('div');
        html`<div>${123}</div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div>123</div>');
      });

      test('renders undefined', () => {
        const container = document.createElement('div');
        html`<div>${undefined}</div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div></div>');
      });

      test('renders null', () => {
        const container = document.createElement('div');
        html`<div>${null}</div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div></div>');
      });

      test('renders a thunk', () => {
        const container = document.createElement('div');
        html`<div>${(_:any)=>123}</div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div>123</div>');
      });

      test('renders thunks that throw as empty text', () => {
        const container = document.createElement('div');
        html`<div>${(_:any)=>{throw new Error('e')}}</div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div></div>');
      });

      test('renders arrays', () => {
        const container = document.createElement('div');
        html`<div>${[1,2,3]}</div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div>123</div>');
      });

      test('renders nested templates', () => {
        const container = document.createElement('div');
        const partial = html`<h1>${'foo'}</h1>`;
        html`${partial}${'bar'}`.renderTo(container);
        assert.equal(container.innerHTML, '<h1>foo</h1>bar');
      });

      test('values contain interpolated values', () => {
        const container = document.createElement('div');
        const t = html`${'a'},${'b'},${'c'}`;
        t.renderTo(container);
        assert.equal(container.innerHTML, 'a,b,c');
      });

      // test('renders multiple nested templates', () => {
      //   const container = document.createElement('div');
      //   const partial = html`<h1>${'foo'}</h1>`;
      //   html`${partial}${'bar'}${partial}${'baz'}qux`.renderTo(container);
      //   assert.equal(container.innerHTML, '<h1>foo</h1>bar<h1>foo</h1>bazqux');
      // });

      test('renders arrays of nested templates', () => {
        const container = document.createElement('div');
        html`<div>${[1,2,3].map((i)=>html`${i}`)}</div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div>123</div>');
      });

      test('renders an element', () => {
        const container = document.createElement('div');
        const child = document.createElement('p');
        html`<div>${child}</div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div><p></p></div>');
      });

      test('renders an array of elements', () => {
        const container = document.createElement('div');
        const children = [
          document.createElement('p'),
          document.createElement('a'),
          document.createElement('span')
        ];
        html`<div>${children}</div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div><p></p><a></a><span></span></div>');
      });

      test('renders to an attribute', () => {
        const container = document.createElement('div');
        html`<div foo="${'bar'}"></div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div foo="bar"></div>');
      });

      test('renders to an attribute without quotes', () => {
        const container = document.createElement('div');
        html`<div foo=${'bar'}></div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div foo="bar"></div>');
      });

      test('renders interpolation to an attribute', () => {
        const container = document.createElement('div');
        html`<div foo="1${'bar'}2${'baz'}3"></div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div foo="1bar2baz3"></div>');
      });

      test('renders a thunk to an attribute', () => {
        const container = document.createElement('div');
        html`<div foo=${(_:any)=>123}></div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div foo="123"></div>');
      });

      test('renders an array to an attribute', () => {
        const container = document.createElement('div');
        html`<div foo=${[1,2,3]}></div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div foo="123"></div>');
      });

      test('renders to an attribute before a node', () => {
        const container = document.createElement('div');
        html`<div foo="${'bar'}">${'baz'}</div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div foo="bar">baz</div>');
      });

      test('renders to an attribute after a node', () => {
        const container = document.createElement('div');
        html`<div>${'baz'}</div><div foo="${'bar'}"></div>`.renderTo(container);
        assert.equal(container.innerHTML, '<div>baz</div><div foo="bar"></div>');
      });

      test('renders a combination of stuff', () => {
        const container = document.createElement('div');
        html`
            <div foo="${'bar'}">
              ${'baz'}
              <p>${'qux'}</p>
            </div>`
          .renderTo(container);
        assert.equal(container.innerHTML, `<div foo="bar">
              baz
              <p>qux</p></div>`);
      });

    });

    suite('update', () => {

      test('renders to and updates a container', () => {
        const container = document.createElement('div');
        let foo = 'aaa';

        const render = () => html`<div>${foo}</div>`;

        render().renderTo(container);
        assert.equal(container.innerHTML, '<div>aaa</div>');
        const div = container.firstChild as HTMLDivElement;
        assert.equal(div.tagName, 'DIV');
        
        foo = 'bbb';
        render().renderTo(container);
        assert.equal(container.innerHTML, '<div>bbb</div>');
        const div2 = container.firstChild as HTMLDivElement;
        // check that only the part changed
        assert.equal(div, div2);
      });

      test('renders to and updates sibling parts', () => {
        const container = document.createElement('div');
        let foo = 'foo';
        let bar = 'bar';

        const render = () => html`<div>${foo}${bar}</div>`;

        render().renderTo(container);
        assert.equal(container.innerHTML, '<div>foobar</div>');
        
        foo = 'bbb';
        render().renderTo(container);
        assert.equal(container.innerHTML, '<div>bbbbar</div>');
      });

      test('renders and updates attributes', () => {
        const container = document.createElement('div');
        let foo = 'foo';
        let bar = 'bar';

        const render = () => html`<div a="${foo}:${bar}"></div>`;

        render().renderTo(container);
        assert.equal(container.innerHTML, '<div a="foo:bar"></div>');
        
        foo = 'bbb';
        render().renderTo(container);
        assert.equal(container.innerHTML, '<div a="bbb:bar"></div>');
      });

      test('updates nested templates', () => {
        const container = document.createElement('div');
        let foo = 'foo';
        let bar = 'bar';
        let baz = 'baz';

        const render = (x: boolean) => {
          let partial;
          if (x) {
            partial = html`<h1>${foo}</h1>`;
          } else {
            partial = html`<h2>${bar}</h2>`;
          }

          return html`${partial}${baz}`;
        }

        render(true).renderTo(container);
        assert.equal(container.innerHTML, '<h1>foo</h1>baz');
        
        foo = 'bbb';
        render(true).renderTo(container);
        assert.equal(container.innerHTML, '<h1>bbb</h1>baz');

        render(false).renderTo(container);
        assert.equal(container.innerHTML, '<h2>bar</h2>baz');
      });

      test('updates arrays', () => {
        const container = document.createElement('div');
        let items = [1, 2, 3];
        const t = () => html`<div>${items}</div>`;
        t().renderTo(container);
        assert.equal(container.innerHTML, '<div>123</div>');

        items = [3, 2, 1];
        t().renderTo(container);
        assert.equal(container.innerHTML, '<div>321</div>');
      });

      test('updates an element', () => {
        const container = document.createElement('div');
        let child: any = document.createElement('p');
        const t = () => html`<div>${child}<div></div></div>`;
        t().renderTo(container);
        assert.equal(container.innerHTML, '<div><p></p><div></div></div>');

        child = undefined;
        t().renderTo(container);
        assert.equal(container.innerHTML, '<div><div></div></div>');

        child = new Text('foo');
        t().renderTo(container);
        assert.equal(container.innerHTML, '<div>foo<div></div></div>');
      });

      test('updates an array of elements', () => {
        const container = document.createElement('div');
        let children: any = [
          document.createElement('p'),
          document.createElement('a'),
          document.createElement('span')
        ];
        const t = () => html`<div>${children}</div>`
        t().renderTo(container);
        assert.equal(container.innerHTML, '<div><p></p><a></a><span></span></div>');

        children = null;
        t().renderTo(container);
        assert.equal(container.innerHTML, '<div></div>');

        children = new Text('foo');
        t().renderTo(container);
        assert.equal(container.innerHTML, '<div>foo</div>');
      });

    });

    suite('extensibility', () => {


      // These tests demonstrate how a flavored layer on top of lit-html could
      // modify the parsed Template to implement different behavior, like setting
      // properties instead of attributes.

      // Note that because the template parse phase captures the pre-parsed
      // attribute names from the template strings, we can retreive the original
      // case of the names!

      class PropertySettingTemplateInstance extends TemplateInstance {
        _createPart(templatePart: TemplatePart, node: Node): Part {
          if (templatePart.type === 'attribute') {
            return new PropertyPart(this, node as Element, templatePart.rawName!, templatePart.strings!);
          }
          return super._createPart(templatePart, node);
        }
        _createInstance(template: Template) {
          return new PropertySettingTemplateInstance(template);
        }
      }

      class PropertyPart extends AttributePart {

        setValue(values: any[]): void {
          const s = this.strings;
          if (s.length === 2 && s[0] === '' && s[s.length - 1] === '') {
            // An expression that occupies the whole attribute value will leave
            // leading and trailing empty strings.
            (this.element as any)[this.name] = values[0];
          } else {
            // Interpolation, so interpolate
            let text = '';
            for (let i = 0; i < s.length; i++) {
              text += s[i];
              if (i < s.length - 1) {
                text += values[i];
              }
            }
            (this.element as any)[this.name] = text;
          }
        }
      }

      test('can replace parts with custom types', () => {
        const container = document.createElement('div');
        const t = html`<div someProp="${123}"></div>`;
        const instance = new PropertySettingTemplateInstance(t.template);
        const fragment = instance._clone();
        instance.update(t.values);
        container.appendChild(fragment);
        assert.equal(container.innerHTML, '<div></div>');
        assert.strictEqual((container.firstElementChild as any).someProp, 123);
      });

      test('works with nested tempaltes', () => {
        const container = document.createElement('div');
        const t = html`${html`<div someProp="${123}"></div>`}`;
        const instance = new PropertySettingTemplateInstance(t.template);
        const fragment = instance._clone();
        instance.update(t.values);
        container.appendChild(fragment);
        assert.equal(container.innerHTML, '<div></div>');
        assert.strictEqual((container.firstElementChild as any).someProp, 123);
      });

    });

  });

  suite('NodePart', () => {

    let container: HTMLElement;
    let startNode: Node;
    let endNode: Node;
    let part: NodePart;

    setup(() => {
      container = document.createElement('div');
      startNode = new Text();
      endNode = new Text();
      container.appendChild(startNode);
      container.appendChild(endNode);
      const instance = new TemplateInstance(html``.template);
      part = new NodePart(instance, startNode, endNode);
    });

    suite('setValue', () => {

      test('accepts a string', () => {
        part.setValue('foo');
        assert.equal(container.innerHTML, 'foo');
      });

      test('accepts a number', () => {
        part.setValue(123);
        assert.equal(container.innerHTML, '123');
      });

      test('accepts undefined', () => {
        part.setValue(undefined);
        assert.equal(container.innerHTML, '');
      });

      test('accepts null', () => {
        part.setValue(null);
        assert.equal(container.innerHTML, '');
      });

      test('accepts a thunk', () => {
        part.setValue((_:any)=>123);
        assert.equal(container.innerHTML, '123');
      });

      test('accepts thunks that throw as empty text', () => {
        part.setValue((_:any)=>{throw new Error('e')});
        assert.equal(container.innerHTML, '');
      });

      test('accepts an element', () => {
        part.setValue(document.createElement('p'));
        assert.equal(container.innerHTML, '<p></p>');
      });

      test('accepts arrays', () => {
        part.setValue([1,2,3]);
        assert.equal(container.innerHTML, '123');
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);
      });

      test('accepts an empty array', () => {
        part.setValue([]);
        assert.equal(container.innerHTML, '');
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);
      });

      test('accepts nested arrays', () => {
        part.setValue([1,[2],3]);
        assert.equal(container.innerHTML, '123');
        assert.deepEqual(['', '1', '', '2', '', '3', ''], Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);
      });

      test('accepts nested templates', () => {
        part.setValue(html`<h1>${'foo'}</h1>`);
        assert.equal(container.innerHTML, '<h1>foo</h1>');
      });

      test('accepts arrays of nested templates', () => {
        part.setValue([1,2,3].map((i)=>html`${i}`));
        assert.equal(container.innerHTML, '123');
      });

      test('accepts an array of elements', () => {
        const children = [
          document.createElement('p'),
          document.createElement('a'),
          document.createElement('span')
        ];
        part.setValue(children);
        assert.equal(container.innerHTML, '<p></p><a></a><span></span>');
      });

      test('updates when called multiple times with simple values', () => {
        part.setValue('abc');
        assert.equal(container.innerHTML, 'abc');
        part.setValue('def');
        assert.equal(container.innerHTML, 'def');
      });

      test('updates when called multiple times with arrays', () => {
        part.setValue([1, 2, 3]);
        assert.equal(container.innerHTML, '123');
        assert.deepEqual(['', '1', '', '2', '', '3', ''], Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);

        part.setValue([]);
        assert.equal(container.innerHTML, '');
        assert.deepEqual(['', ''], Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);
      });

      test('updates when called multiple times with arrays 2', () => {
        part.setValue([1, 2, 3]);
        assert.equal(container.innerHTML, '123');
        assert.deepEqual(['', '1', '', '2', '', '3', ''], Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);

        part.setValue([4, 5]);
        assert.equal(container.innerHTML, '45');
        assert.deepEqual(['', '4', '', '5', ''], Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);

        part.setValue([]);
        assert.equal(container.innerHTML, '');
        assert.deepEqual(['', ''], Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);

        part.setValue([4, 5]);
        assert.equal(container.innerHTML, '45');
        assert.deepEqual(['', '4', '', '5', ''], Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);
      });

      test('updates nested arrays', () => {
        part.setValue([1,[2],3]);
        assert.equal(container.innerHTML, '123');
        assert.deepEqual(['', '1', '', '2', '', '3', ''], Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);

        part.setValue([[1],2,3]);
        assert.equal(container.innerHTML, '123');
        assert.deepEqual(['', '1', '', '2', '', '3', ''], Array.from(container.childNodes).map((n) => n.nodeValue));
        assert.strictEqual(container.firstChild, startNode);
        assert.strictEqual(container.lastChild, endNode);
      });


      test('updates are stable when called multiple times with templates', () => {
        let value = 'foo';
        const r = () => html`<h1>${value}</h1>`;
        part.setValue(r);
        assert.equal(container.innerHTML, '<h1>foo</h1>');
        const originalH1 = container.querySelector('h1');

        value = 'bar';
        part.setValue(r);
        assert.equal(container.innerHTML, '<h1>bar</h1>');
        const newH1 = container.querySelector('h1');
        assert.isTrue(newH1 === originalH1);
      });

      test('updates are stable when called multiple times with arrays of templates', () => {
        let items = [1, 2, 3];
        const r = () => items.map((i)=>html`<li>${i}</li>`);
        part.setValue(r);
        assert.equal(container.innerHTML, '<li>1</li><li>2</li><li>3</li>');
        const originalLIs = Array.from(container.querySelectorAll('li'));

        items = [3, 2, 1];
        part.setValue(r);
        assert.equal(container.innerHTML, '<li>3</li><li>2</li><li>1</li>');
        const newLIs = Array.from(container.querySelectorAll('li'));
        assert.deepEqual(newLIs, originalLIs);
      });

    });

    suite('clear', () => {

      test('is a no-op on an already empty range', () => {
        part.clear();
        assert.deepEqual(Array.from(container.childNodes), [startNode, endNode]);
      });

      test('clears a range', () => {
        container.insertBefore(new Text('foo'), endNode);
        part.clear();
        assert.deepEqual(Array.from(container.childNodes), [startNode, endNode]);
      });

    });

  });

});
