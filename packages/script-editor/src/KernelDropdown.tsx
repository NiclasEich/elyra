/*
 * Copyright 2018-2022 Elyra Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ReactWidget } from '@jupyterlab/apputils';
import { KernelSpec } from '@jupyterlab/services';

import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  RefObject,
  useRef,
  useEffect
} from 'react';

import { CustomScriptEditor } from './CustomScriptEditor';

const KERNEL_SELECT_CLASS = 'elyra-ScriptEditor-KernelSelector';
const CLUSTER_SELECT_CLASS = 'elyra-ScriptEditor-ClusterSelector';

export interface ISelect {
  getSelection: () => string;
}

interface IProps {
  specs: KernelSpec.ISpecModels;
}

export interface IDropPropsOptions {
  display_name: string;
  identifier: string;
}

export interface IDropProps {
  specs: IDropPropsOptions[];
}

/**
 * A toolbar dropdown component populated with available kernel specs.
 */
// eslint-disable-next-line react/display-name
const DropDown = forwardRef<ISelect, IProps>(({ specs }, select) => {
  const initVal = Object.values(specs.kernelspecs ?? [])[0]?.name ?? '';
  const [selection, setSelection] = useState(initVal);

  // Note: It's normally best to avoid using an imperative handle if possible.
  // The better option would be to track state in the parent component and handle
  // the change events there as well, but I know this isn't always possible
  // alongside jupyter.
  useImperativeHandle(select, () => ({
    getSelection: (): string => selection
  }));

  const kernelOptions = !Object.keys(specs.kernelspecs).length ? (
    <option key="no-kernel" value="no-kernel">
      No Kernel
    </option>
  ) : (
    Object.entries(specs.kernelspecs).map(([key, val]) => (
      <option key={key} value={key}>
        {val?.display_name ?? key}
      </option>
    ))
  );

  return (
    <select
      className={KERNEL_SELECT_CLASS}
      onChange={(e): void => setSelection(e.target.value)}
      value={selection}
    >
      {kernelOptions}
    </select>
  );
});

const usePrevious = function<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};

// eslint-disable-next-line react/display-name
const TestDropDown = forwardRef<ISelect, IDropProps>(({ specs }, select) => {
  console.log(specs);
  const initVal = specs[0].display_name ?? 'local';
  const [selection, setSelection] = useState(initVal);
  const prevSelection = usePrevious(selection);

  // Note: It's normally best to avoid using an imperative handle if possible.
  // The better option would be to track state in the parent component and handle
  // the change events there as well, but I know this isn't always possible
  // alongside jupyter.
  useImperativeHandle(select, () => ({
    getSelection: (): string => selection
  }));

  const clusterOptions = !Object.keys(specs).length ? (
    <option key="no-cluster" value="no-cluster">
      No Cluster
    </option>
  ) : (
    Object.entries(specs).map(([key, val]) => (
      <option key={key} value={key}>
        {val?.display_name ?? key}
      </option>
    ))
  );

  console.log('Selection:\t' + selection);
  console.log('prev Selection:' + prevSelection);

  const command = (select: string): string => {
    let command = '';
    if (select === '1') {
      command = 'gpu %file';
    } else if (select === '2') {
      command = 'cpu %file';
    } else {
      command = 'python %file';
    }
    return command;
  };

  // if (selection === '3') {
  //   CustomScriptEditor.instance.addCommandLine(command(prevSelection!));
  // }
  // if (selection !== '3') {
  CustomScriptEditor.instance.addCommandLine(command(selection!));
  // }

  return (
    <select
      className={CLUSTER_SELECT_CLASS}
      onChange={(e): void => {
        setSelection(e.target.value);
      }}
      value={selection}
    >
      {clusterOptions}
    </select>
  );
});
/**
 * Wrap the dropDown into a React Widget in order to insert it into a Lab Toolbar Widget
 */
export class KernelDropdown extends ReactWidget {
  /**
   * Construct a new CellTypeSwitcher widget.
   */
  constructor(
    private specs: KernelSpec.ISpecModels,
    private ref: RefObject<ISelect>
  ) {
    super();
  }

  render(): React.ReactElement {
    return <DropDown ref={this.ref} specs={this.specs} />;
  }
}

export class ClusterDropdown extends ReactWidget {
  /**
   * Construct a new CellTypeSwitcher widget.
   */
  constructor(
    private specs: IDropPropsOptions[],
    private ref: RefObject<ISelect>
  ) {
    super();
  }

  render(): React.ReactElement {
    return <TestDropDown ref={this.ref} specs={this.specs} />;
  }
}

const Textline: React.FC<{ defaultValue: string }> = ({
  defaultValue
}): JSX.Element => {
  const [query, setQuery] = useState(defaultValue);

  // This function is called when the input changes
  const inputHandler = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const enteredName = event.target.value;
    (window as any).command = enteredName;
    console.log('command:' + enteredName);
    setQuery(enteredName);
  };

  return (
    <div className="container">
      <div className="wrapper">
        <input value={query} onChange={inputHandler} className="input" />
      </div>
    </div>
  );
};

export class TextLine extends ReactWidget {
  constructor(private defaultValue: string) {
    super();
  }
  render(): React.ReactElement {
    return <Textline defaultValue={this.defaultValue} />;
  }
}
