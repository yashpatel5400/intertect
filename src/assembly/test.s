add $t2 $t0 $t1
.file   1 "test.c"
        .section .mdebug.abi32
        .previous
        .nan    legacy
        .module fp=32
        .module nooddspreg
        .abicalls
        .text
        .rdata
        .align  2
$LC0:
        .ascii  "hello, world!\000"
        .text
        .align  2
        .globl  main
        .set    nomips16
        .set    nomicromips
        .ent    main
        .type   main, @function
main:
        .frame  $fp,32,$31              # vars= 0, regs= 2/0, args= 16, gp= 8
        .mask   0xc0000000,-4
        .fmask  0x00000000,0
        .set    noreorder
        .set    nomacro
        addiu   $sp,$sp,-32
        sw      $31,28($sp)
        sw      $fp,24($sp)
        move    $fp,$sp
        lui     $28,%hi(__gnu_local_gp)
        addiu   $28,$28,%lo(__gnu_local_gp)
        .cprestore      16
        lui     $2,%hi($LC0)
        addiu   $4,$2,%lo($LC0)
        lw      $2,%call16(puts)($28)
        nop
        move    $25,$2
        .reloc  1f,R_MIPS_JALR,puts
1:      jalr    $25
        nop

        lw      $28,16($fp)
        move    $2,$0
        move    $sp,$fp
        lw      $31,28($sp)
        lw      $fp,24($sp)
        addiu   $sp,$sp,32
        jr      $31
        nop

        .set    macro
        .set    reorder
        .end    main
        .size   main, .-main
        .ident  "GCC: (GNU) 8.2.0"
