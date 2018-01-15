
ga1 init 0

gicos ftgen 0, 0, 16384, 11, 1 

seed 0

instr 1
itie tival

i_instanceNum = p4
S_xName sprintf "touch.%d.x", i_instanceNum
S_yName sprintf "touch.%d.y", i_instanceNum

kx = chnget:k(S_xName)
ky = chnget:k(S_yName)

kx = port(kx, 0.02, chnget:i(S_xName))
ky = port(ky, 0.02, chnget:i(S_yName))

kenv linsegr 0, .01, 1, .1, 1, .25, 0
a1 vco2 ky * .25 * kenv, 100 + (log(1 - kx) * 2000), 0
;a1 = gbuzz(ky * .25 * kenv, 100 + (log(1 - kx) * 2000), 16, 1, 0.25, gicos)

ga1 = ga1 + a1

endin

instr 2

;kcutoff chnget "cutoff"
;kresonance chnget "resonance"

kcutoff = 6000
kresonance = .2

kbase = rspline(250, 700, 0.1, 0.5)

av1 = zdf_2pole(ga1, kbase * rspline(1, 1.25, 0.2, 1), 
                rspline(0.5, 6, 0.1, 0.5), 2)

av2 = zdf_2pole(ga1, kbase * rspline(1, 1.25, 0.2, 1) * 2, 
                rspline(0.5, 6, 0.1, 0.5), 2)
av3 = zdf_2pole(ga1, kbase * rspline(1, 1.25, 0.2, 1) * 4, 
                rspline(0.5, 6, 0.1, 0.5), 2)
av4 = zdf_2pole(ga1, kbase * rspline(1, 1.25, 0.2, 1) * 8, 
                rspline(0.5, 6, 0.1, 0.5), 2)
av5 = zdf_2pole(ga1, kbase * rspline(1, 1.25, 0.2, 1) * 16, 
                rspline(0.5, 6, 0.1, 0.5), 2)

asig = sum(av1, av2, av3, av4, av5)
asig /= 4

/*kthresh = -20*/
/*kloknee = -15*/
/*khiknee = -5*/
/*kratio  = 3*/
/*katt    = 0.1*/
/*krel    = .5*/
/*ilook   = .02*/
/*asig  compress2 asig, asig, kthresh, kloknee, khiknee, kratio, katt, krel, ilook ; voice-activated compressor*/


adelay init 0
/*asig moogladder asig, kcutoff, kresonance*/

asig += adelay
adelay vdelay3 asig * .25, 500, 1000
aL, aR reverbsc asig, asig, .72, 5000

aL = ntrpol(asig, aL, 0.1)
aR = ntrpol(asig, aR, 0.2)

/*aL = asig*/
/*aR = asig*/

outs aL, aR

ga1 = 0

endin

schedule(2, 0, -1)
