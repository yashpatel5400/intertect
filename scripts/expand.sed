s/b\t\(.*\)/j\t\1/
s/move\t\(.*\),\(.*\)/addui\t\1,\2,$zero/
s/$0\b/$zero/g
s/$1\b/$at/g
s/$2\b/$v0/g
s/$3\b/$v1/g
s/$4\b/$a0/g
s/$5\b/$a1/g
s/$6\b/$a2/g
s/$7\b/$a3/g
s/$8\b/$t0/g
s/$9\b/$t1/g
s/$10\b/$t2/g
s/$11\b/$t3/g
s/$12\b/$t4/g
s/$13\b/$t5/g
s/$14\b/$t6/g
s/$15\b/$t7/g
s/$16\b/$s0/g
s/$17\b/$s1/g
s/$18\b/$s2/g
s/$19\b/$s3/g
s/$20\b/$s4/g
s/$21\b/$s5/g
s/$22\b/$s6/g
s/$23\b/$s7/g
s/$24\b/$t8/g
s/$25\b/$t9/g
s/$26\b/$k0/g
s/$27\b/$k1/g
s/$28\b/$gp/g
s/$29\b/$sp/g
s/$30\b/$fp/g
s/$31\b/$ra/g
