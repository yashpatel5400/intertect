import React, {Component} from 'react';
import { Button, Card, CardBody, CardTitle, CardHeader,
  Dropdown, DropdownToggle, DropdownMenu, DropdownItem,
  Popover, PopoverHeader, PopoverBody,
  Modal, ModalHeader, ModalBody, ModalFooter, ListGroup, ListGroupItem,
  Navbar, NavItem, NavbarNav, NavbarBrand, Collapse } from 'mdbreact';
import PropTypes from 'prop-types';

import ReactMarkdown from 'react-markdown';
import AceEditor from 'react-ace';
import SlidingPane from 'react-sliding-pane';
import YouTube from 'react-youtube';

import MemoryTable from './MemoryTable.js'
import RegistersTable from './RegistersTable.js'
import Implement from './Implement.js'

import {Memory, Registers, Latches, nameToRegisterMap} from '../utils/util.js';
import {lessonParts, lessonContent, lessonRegisterInits, lessonAssembly,
  lessonStarterCode, lessonReferenceSolutions, lessonBinaryCode,
  lessonPipelineStudent} from '../utils/lessonItems.js';

import '../styles/intro.css';

function ToUint32(x) {
  return x >>> 0;
}

class LessonPage extends Component {
  constructor(props) {
    super(props);

    if (localStorage.getItem('completedParts') > lessonParts[this.props.completedLessons]) {
      localStorage.setItem('completedParts', lessonParts[this.props.completedLessons]);
    }
    var completedParts = localStorage.getItem('completedParts');

    var lessonPart = `lesson_${this.props.lesson}/part_${this.props.lessonPartNum}`;
    var letters = Object.values(lessonContent[lessonPart]);

    var studentRegisters = new Registers();
    var referenceRegisters = new Registers();

    studentRegisters.load(lessonRegisterInits[lessonPart]);
    referenceRegisters.load(lessonRegisterInits[lessonPart]);

    var studentMemory = new Memory();
    var referenceMemory = new Memory();

    // we want to load the binary program into memory after lesson 3
    if (this.props.lesson > 2) {
      for (var i = 0; i < lessonBinaryCode[lessonPart].length; i++) {
        studentMemory.write(i, lessonBinaryCode[lessonPart][i]);
        referenceMemory.write(i, lessonBinaryCode[lessonPart][i]);
      }
    }

    this.state = {
      isIntroPaneOpen: true,
      revealCompletedLevels: false,
      confirmRestart: false,
      showAbout: false,

      programCounter: 0,
      running: false,

      lesson: this.props.lesson,
      lessonPart: this.props.lessonPartNum,

      completedLessons: this.props.completedLessons,
      completedParts: completedParts || 2,

      lessonComplete: false,
      lessonCorrect: true,

      // program the student starts this particular lesson with
      starterProgram: JSON.parse(localStorage.getItem('starterProgram')) || {},

      studentProgram: lessonStarterCode[lessonPart],
      lessonContent : letters[letters.length - 1],
      assemblyProgram : lessonAssembly[lessonPart].split("\n"),
      binaryProgram : lessonBinaryCode[lessonPart],

      studentRegisters : studentRegisters,
      referenceRegisters : referenceRegisters,

      studentLatches: new Latches(),
      referenceLatches: new Latches(),

      studentMemory : studentMemory,
      referenceMemory : referenceMemory,

      studentPipeline: [],
      referencePipeline: [],

      // memory becomes relevant after lesson 1.5
      showMemory: (this.props.lesson != 1 || this.props.lessonPart > 5),
      showRegisters: true,
      unviewedStepExplanation: true,
      unviewedMemoryExplanation: true,

      programRunning: false
    }

    this.onChange = this.onChange.bind(this);
    this.saveProgram = this.saveProgram.bind(this);
    this.toggleCompletedLevels = this.toggleCompletedLevels.bind(this);
    this.toggleShowAbout = this.toggleShowAbout.bind(this);
    this.userProgramExists = this.userProgramExists.bind(this);
    this.appendUserProgram = this.appendUserProgram.bind(this);
    this.loadLesson = this.loadLesson.bind(this)
  }

  onChange(newValue) {
    this.setState({ studentProgram: newValue});
  }

  saveProgram(lesson, lessonPartNum, starterProgram) {
    var lessonPart = `lesson_${lesson}/part_${lessonPartNum}`;
    var updatedStarterProgram = Object.assign({}, starterProgram);
    updatedStarterProgram[lessonPart] = this.state.studentProgram;
    this.setState({
      starterProgram: updatedStarterProgram,
    })

    localStorage.setItem('starterProgram', JSON.stringify(updatedStarterProgram));
  }

  componentDidUpdate() {
    if (this.state.running) {
      this.step();
    }
  }

  loadCode(lesson, lessonPartNum, starterProgram) {
    var lessonPart = `lesson_${lesson}/part_${lessonPartNum}`;

    // lesson parts are made incrementally to keep student code in tact
    var updatedStarterProgram = Object.assign({}, starterProgram);
    updatedStarterProgram[lessonPart] = this.state.studentProgram;
    this.setState({
      starterProgram: updatedStarterProgram,
    })

    localStorage.setItem('starterProgram', JSON.stringify(updatedStarterProgram));
  }

  toggleCompletedLevels() {
    this.setState({
      revealCompletedLevels: false
    });
  }

  toggleShowAbout() {
    this.setState({
      showAbout: false
    });
  }

  userProgramExists() {
    return document.getElementById('user-program') != null;
  }

  appendUserProgram() {
    // Get and subsequently remove the user's script
    var script = document.getElementById('user-program');
    if (script != null) {
      script.parentNode.removeChild(script);
    }

    script = document.createElement('script');
    script.setAttribute('id', 'user-program');

    try {
      script.appendChild(document.createTextNode(this.state.studentProgram));
      document.body.appendChild(script);
    } catch (e) {
      script.text = this.state.studentProgram;
      document.body.appendChild(script);
    }
  }

  loadLesson(lesson, lessonPartNum, resetCode) {
    if (lessonPartNum > lessonParts[lesson]) {
      lessonPartNum = 1;
      lesson += 1;
    }

    // Reset the user program every time the lesson is loaded.  This
    // has the effect of reloading the user code only when they click
    // "reset"
    this.appendUserProgram();
    this.setState({ programRunning: false });

    var lessonPart = `lesson_${lesson}/part_${lessonPartNum}`;
    if (lessonPartNum > this.state.completedParts) {
      this.setState({ completedParts : lessonPartNum - 1 })
      localStorage.setItem('completedParts', lessonPartNum - 1);
    }

    if (lesson > this.state.completedLessons) {
      this.setState({ completedLessons : lesson - 1 })
      localStorage.setItem('completedLessons', lesson - 1);
    }

    var starterProgram;
    if (this.state.starterProgram[lessonPart] == null) {
      // lesson parts are made incrementally to keep student code in tact
      var insertionPoint = this.state.studentProgram.indexOf("default:");
      var studentProgram =
        this.state.studentProgram.substr(0,insertionPoint) +
        `${lessonStarterCode[lessonPart]}\n` +
        this.state.studentProgram.substr(insertionPoint,);

      starterProgram = Object.assign({}, this.state.starterProgram);
      starterProgram[lessonPart] = studentProgram;
      this.setState({
        starterProgram: starterProgram,
      })

      localStorage.setItem('starterProgram', JSON.stringify(starterProgram));
    } else {
      starterProgram = this.state.starterProgram;
    }

    if (resetCode) {
      this.setState({ studentProgram : starterProgram[lessonPart] });
    }

    var studentRegisters = new Registers();
    var referenceRegisters = new Registers();

    var studentMemory = new Memory();
    var referenceMemory = new Memory();

    studentRegisters.load(lessonRegisterInits[lessonPart]);
    referenceRegisters.load(lessonRegisterInits[lessonPart]);

    // only need the binary code available for lessons 2 and up
    if (lesson > 1) {
      this.setState({
        binaryProgram : lessonBinaryCode[lessonPart],
      })

      // we want to load the binary program into memory after lesson 3
      if (lesson > 2) {
        for (var i = 0; i < lessonBinaryCode[lessonPart].length; i++) {
          studentMemory.write(i, lessonBinaryCode[lessonPart][i]);
          referenceMemory.write(i, lessonBinaryCode[lessonPart][i]);
        }
      }
    }

    var letters = Object.values(lessonContent[lessonPart]);
    this.setState({
      lessonComplete: false,
      lessonCorrect: true,

      programCounter: 0,

      lesson : lesson,
      lessonPart : lessonPartNum,

      lessonContent : letters[letters.length - 1],
      assemblyProgram : lessonAssembly[lessonPart].split("\n"),

      studentRegisters : studentRegisters,
      referenceRegisters : referenceRegisters,

      studentLatches: new Latches(),
      referenceLatches: new Latches(),

      studentMemory : studentMemory,
      referenceMemory : referenceMemory,

      // memory becomes relevant after lesson 1.5
      showMemory: (lesson != 1 || lessonPartNum > 5),

      loadedLesson : true,
    })
  }

  pcToLineNumber(programCounter) {
    var assemblyProgram = this.state.assemblyProgram;
    if (assemblyProgram.length == 0) {
      return -1;
    }

    var targetInstruction = programCounter / 4;

    var line;
    for (line = 0; targetInstruction > 0; line++) {
      if (line >= assemblyProgram.length) {
        return -1;
      }

      // needs to not be an empty line or one associated with a label
      if (assemblyProgram[line] != "" && assemblyProgram[line].indexOf(":") == -1) {
        targetInstruction--;
      }
    }

    while (assemblyProgram[line] == "" || assemblyProgram[line].indexOf(":") != -1) {
      line++;
      if (line >= assemblyProgram.length) {
        return -1;
      }
    }

    return line;
  }

  // Return the next instruction to execute
  // Returns undefined if we have reached the end of the file
  getNextInstruction(programCounter = -1) {
    if (programCounter == -1) {
      programCounter = this.state.programCounter
    }
    // instruction is passed as assembly for lesson 1 and binary for all
    // others
    var instruction;
    if (this.state.lesson == 1) {
      var line_num = this.pcToLineNumber(programCounter);
      // console.log(line_num)
      if (line_num == -1) {
        return undefined;
      }
      instruction = this.state.assemblyProgram[line_num]
        .replace(/[,)]/g,"")
        .replace(/\(/," ")
        .split(" ");
      // Unfortunately we have to special-case the loads and stores because
      // they have a different syntax
      if (["lw", "lh", "lb", "sw", "sh", "sb"].indexOf(instruction[0]) >= 0) {
        var temp = instruction[2];
        instruction[2] = instruction[3];
        instruction[3] = temp;
      }
    } else {
      if (programCounter >= this.state.binaryProgram.length) {
        return undefined;
      }
      var byte_1 = this.state.binaryProgram[programCounter];
      var byte_2 = this.state.binaryProgram[programCounter + 1];
      var byte_3 = this.state.binaryProgram[programCounter + 2];
      var byte_4 = this.state.binaryProgram[programCounter + 3];

      instruction = byte_4;
      instruction |= byte_3 << 8;
      instruction |= byte_2 << 16;
      instruction |= byte_1 << 24;
    }

    return instruction;
  }

  // Step one instruction forward and execute
  step() {
    if (!this.userProgramExists() || !this.state.programRunning) {
      this.appendUserProgram();
      this.setState({programRunning: true});
    }

    var instruction = this.getNextInstruction();
    var pcRegister = nameToRegisterMap["$pc"];

    var lessonPart = `lesson_${this.state.lesson}/part_${this.state.lessonPart}`;
    var solution = lessonReferenceSolutions[lessonPart];

    if (this.state.lesson < 4 && typeof(instruction) !== 'undefined') {
      // beyond lesson 2, students must fetch the instructions themselves
      if (this.state.lesson == 3) {
        var IF_fn, ID_fn, EX_fn, MEM_fn, WB_fn;
        var studentPipelineImpl = lessonPipelineStudent[lessonPart];

        try {
          // eslint-disable-next-line
          IF_fn = studentPipelineImpl.indexOf("IF") != -1 ? IF : solution.IF;
          // eslint-disable-next-line
          ID_fn = studentPipelineImpl.indexOf("ID") != -1 ? ID : solution.ID;
          // eslint-disable-next-line
          EX_fn = studentPipelineImpl.indexOf("EX") != -1 ? EX : solution.EX;
          // eslint-disable-next-line
          MEM_fn = studentPipelineImpl.indexOf("MEM") != -1 ? MEM : solution.MEM;
          // eslint-disable-next-line
          WB_fn = studentPipelineImpl.indexOf("WB") != -1 ? WB : solution.WB;
        } catch(e) { /* student renamed function -- no execution */ }

        IF_fn(this.state.studentLatches, this.state.studentRegisters, this.state.studentMemory);
        ID_fn(this.state.studentLatches, this.state.studentRegisters, this.state.studentMemory);
        EX_fn(this.state.studentLatches, this.state.studentRegisters, this.state.studentMemory);
        MEM_fn(this.state.studentLatches, this.state.studentRegisters, this.state.studentMemory);
        WB_fn(this.state.studentLatches, this.state.studentRegisters, this.state.studentMemory);
        solution.processMIPS(this.state.referenceLatches, this.state.referenceRegisters, this.state.referenceMemory);
      }

      else {
        try {
          // eslint-disable-next-line
          processMIPS(instruction, this.state.studentRegisters, this.state.studentMemory);
        } catch(e) { /* student renamed function -- no execution */  }
        solution(instruction, this.state.referenceRegisters, this.state.referenceMemory);
      }
    } else if (this.state.lesson == 4) {
      // eslint-disable-next-line
      processMIPS(this.state.studentLatches, this.state.studentRegisters, this.state.studentMemory);
      solution(this.state.referenceLatches, this.state.referenceRegisters, this.state.referenceMemory);
    }

    var lessonComplete = (typeof(this.getNextInstruction(this.state.programCounter + 4)) === 'undefined'
      && (this.state.lesson < 4 || this.state.studentLatches.empty()));

    this.setState({
      lessonCorrect :
        this.state.studentRegisters.compareRegisters(this.state.referenceRegisters) &&
        this.state.studentMemory.compareMemory(this.state.referenceMemory),
      lessonComplete : lessonComplete,
      running : lessonComplete ? false : this.state.running,
    });

    var newPcStudent = this.state.studentRegisters.read(pcRegister)
    if (!this.state.studentRegisters.wrotePc) {
      this.state.studentRegisters.write(pcRegister, newPcStudent + 4)
    }

    var newPcReference = this.state.referenceRegisters.read(pcRegister)
    if (!this.state.referenceRegisters.wrotePc) {
      this.state.referenceRegisters.write(pcRegister, newPcReference + 4)
    }

    // eslint-disable-next-line
    this.state.studentRegisters.wrotePc = false;
    // eslint-disable-next-line
    this.state.referenceRegisters.wrotePc = false;

    this.setState({
      programCounter : this.state.studentRegisters.read(pcRegister)
    });
  }

  render() {
    var assemblyList = [];
    var lineNum = this.pcToLineNumber(this.state.programCounter);
    for (var i = 0; i < this.state.assemblyProgram.length-1; i++) {
      assemblyList.push(
        <span className={lineNum == i ? "active" : "inactive"}>
          {this.state.assemblyProgram[i]}<br/>
        </span>);
    }

    var pulsatingInterest =
      <div className="pulsating-dot__ripple">
        <span></span>
        <div></div>
        <div></div>
        <div></div>
      </div>;

    var stepExplanation;
    if (this.state.unviewedStepExplanation) {
      stepExplanation =
        <Popover placement="right" component="a" popoverBody={pulsatingInterest}>
          <PopoverHeader></PopoverHeader>
          <PopoverBody>This is how you{"'"}ll be running your code!
            <ul>
              <li><b>Run</b>: Execute the entire assembly program with your implementation</li>
              <li><b>Step</b>: Execute just the highlighted line with your implementation</li>
              <li><b>Reset</b>: Reset all the register/memory values and bring the execution back to the beginning</li>
            </ul>
            <Button outline style={{width:"100%"}}
              onClick={() => this.setState({ unviewedStepExplanation : false })}>
              <i className="fa fa-stop" aria-hidden="true"></i>Close Help
            </Button>
          </PopoverBody>
        </Popover>;
    } else {
      stepExplanation = <div></div>;
    }

    var memoryExplanation;
    if (this.state.unviewedMemoryExplanation) {
      memoryExplanation =
        <Popover placement="right" component="a" popoverBody={pulsatingInterest}>
          <PopoverHeader></PopoverHeader>
          <PopoverBody>This is debug corner! You{"'"}ll see all the values of registers and memory in this
          area, which you can use for debugging what{"'"}s is going on when you run your program.
            <Button outline style={{width:"100%"}}
              onClick={() => this.setState({ unviewedMemoryExplanation : false })}>
              <i className="fa fa-stop" aria-hidden="true"></i> Close Help
            </Button>
          </PopoverBody>
        </Popover>
    } else {
      memoryExplanation = <div></div>
    }

    var completedLessons = [];
    var lessons = Array.range(1, 5)
    lessons.map((lesson) => {
      var numPartsForLesson = lesson <= this.state.completedLessons ? lessonParts[this.state.completedLessons] : this.state.completedParts;
      var parts = Array.range(1, numPartsForLesson + 1)
      if (lesson <= this.state.completedLessons + 1) {
        completedLessons.push(<ListGroupItem active>Lesson {lesson}</ListGroupItem>);
        parts.map((part) => {
          if (part > lessonParts[lesson]) {
            return;
          }
          completedLessons.push(
            <ListGroupItem>
              <div className="row align-middle">
                <div className="col-sm-3">Part {part}</div>
                <div className="col-sm-9">
                  <Button outline onClick={() => {
                      this.setState({
                        isIntroPaneOpen: true,
                        revealCompletedLevels: false
                      });

                    this.loadLesson(lesson, part, true);
                    }} style={{width:"100%"}}>
                    Redo
                  </Button>
                </div>
              </div>
            </ListGroupItem>)
          });
        }
      }
    )

    var currentInstruction;
    this.state.lesson > 1 ?
      currentInstruction = <Button outline style={{width:"100%"}}>
        Current Instruction: {
          typeof(this.getNextInstruction()) === 'undefined' ? "Done!" : ToUint32(this.getNextInstruction()).toString(2)
        }
      </Button>
      : currentInstruction = <div></div>

    return (
      <div>
        <SlidingPane
            isOpen={ this.state.isIntroPaneOpen }
            width='50%'
            onRequestClose={ () => {
              this.setState({ isIntroPaneOpen: false });
            }}>

          <YouTube videoId="FAUnDDTz30k" opts={{
            width: "100%",
            playerVars: {
              autoplay: 1
            }
          }}/>
          <ReactMarkdown source={this.state.lessonContent} escapeHtml={false} />
        </SlidingPane>

        <Navbar color="default-color-dark" dark>
          <NavbarBrand href="#">
            <Button outline onClick={() => this.setState({
                  loadedLesson : false,
                  lesson : null,
                })}>
              Main Menu
            </Button>
          </NavbarBrand>
          <Collapse isOpen={true}>
            <NavbarNav>
              <NavItem>
                <Button outline onClick={() => this.setState({ revealCompletedLevels : true })}>
                  Previous Levels
                </Button>

                <Button outline onClick={() => this.setState({ isIntroPaneOpen : true })}>
                  Intro Text
                </Button>
              </NavItem>
            </NavbarNav>
          </Collapse>
        </Navbar>

        <Modal isOpen={this.state.revealCompletedLevels} toggle={() => this.toggleCompletedLevels()} centered>
          <ModalHeader>Completed Levels</ModalHeader>
          <ModalBody>
            <ListGroup> {completedLessons} </ListGroup>
          </ModalBody>
          <ModalFooter>
            <div className="row">
              <div className="col-sm-12">
                <Button outline onClick={() => this.setState({revealCompletedLevels : false})} style={{width:"100%"}}>
                  Close
                </Button>
              </div>
            </div>
          </ModalFooter>
        </Modal>

        <Modal isOpen={this.state.lessonCorrect && this.state.lessonComplete}
          frame position="bottom">

          <ModalHeader>Great Work!</ModalHeader>
          <ModalBody className="text-center">
            <div className="row">
              <div className="col-sm-6">
                <Button outline style={{width:"100%"}}
                    onClick={() => {
                    this.setState({
                      isIntroPaneOpen: true,
                    });

                    this.saveProgram(this.state.lesson,
                      this.state.lessonPart, this.state.starterProgram)
                    this.loadLesson(this.state.lesson, this.state.lessonPart + 1, true);
                  }}> Next Lesson
                </Button>
              </div>

              <div className="col-sm-6">
                <Button outline color="danger" onClick={() =>
                  this.loadLesson(this.state.lesson, this.state.lessonPart, false)} style={{width:"100%"}}>
                  I Want To Stay Here
                </Button>
              </div>
            </div>
          </ModalBody>
        </Modal>

        <Modal isOpen={!this.state.lessonCorrect && this.state.lessonComplete}
          frame position="bottom">

          <ModalHeader>Oops, let{"'"}s try again!</ModalHeader>
          <ModalBody className="text-center">
            <div className="row">
              <div className="col-sm-6">
                <Button outline style={{width:"100%"}}
                  onClick={() => this.loadLesson(this.state.lesson, this.state.lessonPart, false)}>
                  <i className="fa fa-refresh" aria-hidden="true"></i> Reset
                </Button>
              </div>

              <div className="col-sm-6">
                <Button outline color="danger" style={{width:"100%"}}
                    onClick={() => {this.setState({ confirmRestart : true })}}>
                  <i className="fa fa-warning" aria-hidden="true"></i> Restart Level
                </Button>
              </div>
            </div>
          </ModalBody>
        </Modal>

        <Modal isOpen={this.state.confirmRestart} centered>
          <ModalHeader>Restart Level</ModalHeader>
          <ModalBody>
            <b>Warning: </b> You will lose <b>all</b> your progress by hitting Continue. Please make sure
            this is what you want before clicking Continue
          </ModalBody>
          <ModalFooter>
            <div className="row">
              <div className="col-sm-6">
                <Button outline onClick={() => this.setState({confirmRestart : false})} style={{width:"100%"}}>
                  Close
                </Button>
              </div>
              <div className="col-sm-6">
                <Button outline color="danger" style={{width:"100%"}}
                  onClick={() => {
                    this.setState({confirmRestart : false })
                    this.loadLesson(this.state.lesson, this.state.lessonPart, true);
                  }}>
                  Continue
                </Button>
              </div>
            </div>
          </ModalFooter>
        </Modal>

        <div className="row" >
          <Implement
            theme={"solarized_dark"}
            onChange={this.onChange}
            studentProgram={this.state.studentProgram} />

          <div className="col-sm-6">
            <Card style={{ marginTop: '1rem', width:"100%"}}>
              <CardHeader color="default-color" className="text-center">
                {stepExplanation}
                <CardTitle componentclassName="h4">
                  Testing
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div className="col-sm-12">
                  <div className="col-sm-12">
                    {currentInstruction}
                    <ul className="shell-body" style={{width:"100%"}}>{ assemblyList }</ul>
                  </div>
                  <div className="col-sm-12">
                    <Button outline color="success" style={{width:"100%"}}
                      onClick={() => {
                        this.setState({running: true})
                      }}>
                      <i className="fa fa-play" aria-hidden="true"></i> Run
                    </Button>
                  </div>
                  <div className="col-sm-12">
                    <Button outline color="default" style={{width:"100%"}}
                      // TODO: Factor this out into a method so it can be called not just from here. Running a program is really just calling step() repeatedly
                      onClick={() => {
                        this.step()
                      }}>
                        <i className="fa fa-forward" aria-hidden="true"></i> Step
                    </Button>
                  </div>
                  <div className="col-sm-12">
                    <Button outline color="warning" style={{width:"100%"}}
                      onClick={() => { this.loadLesson(this.state.lesson, this.state.lessonPart, false) }}>
                      <i className="fa fa-refresh" aria-hidden="true"></i> Reset
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card style={{ marginTop: '1rem', width:"100%"}}>
              <CardHeader color="default-color" className="text-center">
                {memoryExplanation}
                <CardTitle componentclassName="h4">
                  Debugging
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div className="row">
                  <div className="col-sm-6">
                    <Button outline
                      onClick={() => this.setState({ showRegisters : !this.state.showRegisters })} style={{width:"100%"}}>
                      {this.state.showRegisters ? "Hide" : "Show" } Registers
                    </Button>

                    <Collapse isOpen={this.state.showRegisters}>
                      <RegistersTable
                        studentRegisters={this.state.studentRegisters}
                        referenceRegisters={this.state.referenceRegisters}
                      />
                    </Collapse>
                  </div>

                  <div className="col-sm-6">
                    <Button outline
                      onClick={() => this.setState({ showMemory : !this.state.showMemory })} style={{width:"100%"}}>
                      {this.state.showMemory ? "Hide" : "Show"} Memory
                    </Button>
                    <Collapse isOpen={this.state.showMemory}>
                      <MemoryTable
                        memory={this.state.studentMemory}
                      />
                    </Collapse>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    )
  }
}

export default LessonPage;