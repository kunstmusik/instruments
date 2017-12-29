
ga1 init 0

instr 1
itie tival

i_instanceNum = p4
S_xName sprintf "touch.%d.x", i_instanceNum
S_yName sprintf "touch.%d.y", i_instanceNum

kx chnget S_xName
ky chnget S_yName

kenv linsegr 0, .01, 1, .1, 1, .25, 0
a1 vco2 ky * .5 * kenv, 60 + (log(1 - kx) * 3000), 0

ga1 = ga1 + a1

endin

instr 2

;kcutoff chnget "cutoff"
;kresonance chnget "resonance"

kcutoff = 6000
kresonance = .2

adelay init 0
a1 moogladder ga1, kcutoff, kresonance

a1 += adelay
adelay vdelay3 a1 * .5, 500, 1000
aL, aR reverbsc a1, a1, .72, 5000

outs aL, aR

ga1 = 0

endin

schedule(2, 0, -1)
