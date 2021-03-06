import React, { Component } from 'react';
import { Tooltip, Table  } from 'mdbreact';
import PropTypes from 'prop-types';

import {Registers, nameToRegisterMap, registerToNameMap} from '../utils/util.js';

function ToUint32(x) {
  return x >>> 0;
}

class RegistersTable extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (this.props.studentRegisters == undefined) return null;

    var registerTable = [];
    var register;
    for (var i = 0; i < this.props.referenceRegisters.usedRegisters.length; i++) {
      var studentRegister = this.props.studentRegisters.usedRegisters[i];
      var referenceRegister = this.props.referenceRegisters.usedRegisters[i];

      var studentValue = `0x${ToUint32(this.props.studentRegisters.read(referenceRegister)).toString(16).toUpperCase()}`;
      var referenceValue = `0x${ToUint32(this.props.referenceRegisters.read(referenceRegister)).toString(16).toUpperCase()}`;

      var tooltipContent, colorClass;

      if (studentRegister != referenceRegister) {
        colorClass = "lesson-debugging__wrong-color";
        if (studentRegister === undefined) {
          tooltipContent = `Sorry, you wrote to a non-existent register! Check to make
            you used the binary representation of register names (using nameToRegisterMap).
            You may have also not yet implemented this instruction.`
        } else {
          tooltipContent = `Oops! You wrote to ${registerToNameMap[studentRegister]}
            instead of ${registerToNameMap[referenceRegister]}`
        }
      } else if (studentValue == referenceValue) {
        colorClass = "lesson-debugging__right-color";
        tooltipContent = "Great job! This is correct.";
      } else {
        colorClass = "lesson-debugging__wrong-color";
        tooltipContent = `Sorry, try again! We expected: ${referenceValue}`;
      }

      registerTable.push(<tr className={colorClass}>
        <td>{registerToNameMap[referenceRegister]}</td>
        <td>
          <Tooltip
            placement="top"
            tooltipContent={tooltipContent}>
              <a className="lesson-debugging__tooltip p-1">{studentValue}</a>
          </Tooltip>
        </td>
      </tr>);
    }

    var registers = Object.keys(nameToRegisterMap);
    for (i = 0; i < registers.length; i++) {
      register = registers[i];
      if (this.props.referenceRegisters.usedRegisters.indexOf(nameToRegisterMap[register]) != -1) {
        continue;
      }

      registerTable.push(<tr>
          <td>{register}</td>
          <td>0x{this.props.studentRegisters.read(nameToRegisterMap[register]).toString(16).toUpperCase()}</td>
        </tr>);
    }

    return (
      <div className="lesson-debugging__registers d-inline-block" id="registersTable">
        <Table hover condensed>
          <thead>
            <tr>
              <th>Register</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody> { registerTable } </tbody>
        </Table>
      </div>
    );
  }
}

RegistersTable.propTypes = {
  studentRegisters: PropTypes.instanceOf(Registers),
  referenceRegisters: PropTypes.instanceOf(Registers)
}

export default RegistersTable;
