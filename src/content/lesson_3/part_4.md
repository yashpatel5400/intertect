# Part 4: Memory (MEM)
We've almost made it to the end of pipelining!  We know this material is
challenging, but you've done really well making it this far; only a little ways
to go.  All that is left to do is memory operations (MEM stage) and register
writeback (WB).

# Code Structure
There are no significant changes between this and the previous part. Refer to
the Latch API below to see what is expected in your output of MEM.

# Your Task
Given the information passed along from the write stage, either perform a memory
operation, or pass the data through to the WB stage.  Some points to keep in
mind:

- Memory results saved in the EX/MEM latch were saved as an array of bytes,
  meaning you'll have to write the results for those one byte at a time.
- Ignore write values that are to be written to registers.  Remember, though,
  that a read instruction will both read from memory as well as write back to
  the register file.

# Latch API Reference
This is left here as a reference to refer to:

- For any latch set to `undefined`, we assume the pipeline stage reading from
  this latch is to be skipped.
- `latches.if_id` (IF/ID latch): Must be the `unsigned 32-bit` binary
  instruction!  Remember once again to call `ToUint32(x)` on whatever binary
  result you get before storing it in the latch
- `latches.id_ex` (ID/EX latch): Construct an object that has the following
  fields/values:
  - R instruction:
    - `op_str`: Functional name for the instruction (i.e. `addu`)
    - `rs`: *Address* location for `$rs`
    - `rt`: *Address* location for `$rt`
    - `rd`: *Address* location for `$rd`
    - `shamt`: Value for `$shamt`
  - J instruction:
    - `op_str`: Functional name for the instruction (i.e. `jal`)
    - `target`: Binary address value for destination
  - I instruction:
    - `op_str`: Functional name for the instruction (i.e. `addiu`)
    - `rs`: *Address* location for `$rs`
    - `rt`: *Address* location for `$rt`
    - `imm`: Value for immediate to be used
- `latches.ex_mem` (EX/MEM latch): This is perhaps the most complicated latch,
  since execute only performs a subset of the instructions and must wrap up all
  others for MEM to continue
  - `instruction`: Instruction that was decoded during ID stage.  This is simply
  passed along in the cases where the decoded instruction is to be executed
  during MEM
  - `memory_address`: For load/store instructions, the final address is
  determined in the EX stage and stored before it is executed in the MEM stage.
  This is where the info is stored
  - `result`: If an instruction was executed, this is where the result is stored
  - `location`: Likewise, if execution was performed, this specifies whether the
  result is to be saved in memory or registers.  As a result, the value of this
  field should always either be `"memory"` or `"registers"`
  - `position`: Position in the final saving location where the result is to be
  saved, i.e. for `memory` this indicates an offset and for `registers` this
  indicates the particular register
- `latches.mem_wb` (MEM/WB latch):
  - `instruction`: Instruction that was decoded during ID stage.  This will not
  be used for further execution but will be critical later when parallelizing
  our pipeline
  - `result`: Value to be written/stored
  - `location`: Should either be `"memory"` or `"registers"` to indicate which
  stage of the pipeline saving should occur
  - `position`: Which register to be written to (if `location` is `"registers"`)
