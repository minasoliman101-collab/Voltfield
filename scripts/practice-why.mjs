/*
 * "Why the other choices are wrong" for the first eight practice sets.
 *
 * Each entry is [start of the question as it reads on the page, [three reasons]].
 * The reasons are in the same order as the wrong choices in gen-practice.mjs,
 * and they name the mistake without repeating the number, because the page
 * prints each wrong choice in front of its reason. gen-practice.mjs refuses to
 * build if a question in those sets has no entry here, or an entry matches
 * nothing, so the two files cannot drift apart silently. If the wrong choices
 * of a question are reordered or changed, its reasons here must follow.
 */
export default [
  // 1 Ohm's law and power
  ['A resistor of 8', ['Multiplies voltage by resistance where it should divide.', 'Divides resistance by voltage, the ratio upside down.', 'Subtracts the resistance from the voltage, which mixes two different units.']],
  ['A current of 2 A flows', ['This is I &times; R, the voltage across the resistor in volts, not the power.', 'Squares the resistance where it is the current that should be squared.', 'Divides resistance by current, which gives nothing meaningful here.']],
  ['A 1,500 W heater is connected', ['Divides the voltage by 15, which is not the calculation.', 'Is a common breaker rating, not the calculated current.', 'Adds 50 percent to the correct figure. No such factor applies to finding the current.']],
  ['A heating element is rated 2,000 W', ['Halves the power along with the voltage. Power goes with the square of the voltage.', 'Assumes the power does not change with the voltage.', 'Divides by eight. Halving the voltage divides the power by four.']],
  ['What is the resistance of a 1,500 W', ['This is the current in amperes, P / V, not the resistance.', 'Divides voltage by power without squaring the voltage.', 'Is ten times the true figure, a slip of the decimal point.']],
  ['A two-wire 120 V circuit runs 100 ft', ['Uses the one-way length. The current returns along a second conductor.', 'Doubles the length twice.', 'This is the resistance of 1,000 ft of the conductor in ohms, not a voltage drop.']],
  ['A 10 kW load runs 24 hours', ['Is a tenth of the true figure, a slip of the decimal point.', 'Is ten times the true figure.', 'Leaves out the 24 hours and misplaces the decimal point.']],
  ['On an AC circuit with a power factor below', ['Watts can never exceed volt-amperes.', 'They are equal only at unity power factor.', 'For a given power, a lower power factor raises the current.']],
  // 2 three-phase and power factor
  ['A balanced three-phase load draws 75 kW', ['Leaves out the 1.732.', 'Leaves out the power factor.', 'Leaves out both the 1.732 and the power factor.']],
  ['A three-phase feeder carries 100 A per phase at 480 V. What is the apparent', ['Leaves out the 1.732.', 'Multiplies by 3, which would need the line-to-neutral voltage.', 'Applies a power factor of 0.9. Apparent power has none.']],
  ['A load draws 400 kW at a power factor of 0.8', ['Multiplies by the power factor. kVA is never smaller than kW.', 'Adds 20 percent to the kW, which is not the same as dividing by 0.8.', 'Adds a nominal 5 percent, which has no basis.']],
  ['The same 400 kW load', ['Multiplies the kW by 0.6, the sine of the angle. That would be right starting from kVA, not from kW.', 'This is the apparent power in kVA.', 'Subtracts kW from kVA. The three are sides of a right triangle and do not subtract.']],
  ['A 480 V three-phase wye system', ['Halves the voltage, which is the split-phase relationship and not the wye one.', '208 V is the line-to-line voltage of a different system, 208Y/120.', 'Multiplies by 1.732 where it should divide.']],
  ['A 400 kW load runs at a power factor of 0.75', ['Multiplies the kW by the difference in power factors, which is not a valid shortcut.', 'This is the reactive power of the load before correction, not the amount to add.', 'This is the reactive power that remains after correction.']],
  ['In a delta-connected winding', ['That is true of a wye connection, not a delta.', 'This has the relationship upside down.', 'The two winding currents are 120 degrees apart, so they add to 1.732 times one of them, not to three.']],
  ['What is the full-load current of a 50 kVA three-phase supply', ['Leaves out the 1.732.', 'Divides by 1.732 twice.', 'Multiplies by 1.732 where it should divide.']],
  // 3 conductors and voltage drop
  ['In the AWG system', ['Area doubles every three sizes; it does not rise by half.', 'Tripling does not match any whole number of gauge steps.', 'Tenfold is the change over ten sizes, not three.']],
  ['A three-phase 480 V feeder runs 150 ft in 4/0', ['Uses a multiplier of 2, which is for single-phase.', 'Leaves out the 1.732.', 'Applies the 1.732 twice.']],
  ['A 120 V circuit has a voltage drop of 6.32', ['3 percent is the usual recommended limit, not the drop on this circuit.', 'Divides by 240 V where the circuit is 120 V.', 'Reads the drop in volts as though it were already a percentage.']],
  ['A continuous load of 80 A', ['Takes the load at 100 percent, with no allowance for continuous duty.', 'Multiplies by 0.8, which applies the rule backwards.', 'Uses 150 percent, which is not the continuous-load factor.']],
  ['For a 3 percent voltage drop, what is the longest one-way run of 12 AWG', ['Leaves out the factor of 2 for the return conductor.', 'Applies the factor of 2 twice.', 'Is a round figure, not the calculated length.']],
  ['What is the resistance of 500 ft of 2 AWG', ['This is the out-and-back resistance. The question asks for one way.', 'This is the resistance of 250 ft.', 'Is ten times the true figure, a slip of the decimal point.']],
  ['A conductor with 90', ['The insulation rating does not override the rating of the terminal.', 'Ampacities are not averaged.', 'The 60&deg;C column applies to terminals rated 60&deg;C, not in every case.']],
  ['Compared with a copper conductor', ['Aluminum is a poorer conductor than copper.', 'Aluminum has more resistance than copper, not less.', 'Three times overstates it. The ratio is about 1.6.']],
  // 4 overcurrent protection
  ['A feeder supplies a continuous load of 52 A', ['60 A is below the 65 A minimum.', '80 A would work, but it is not the smallest that does.', '90 A is two sizes larger than needed.']],
  ['A feeder supplies 40 A of continuous load', ['60 A covers the load at 100 percent only, with nothing added for the continuous part.', '80 A comes from applying 125 percent to the whole load. Only the continuous part takes the factor.', '90 A is larger than needed.']],
  ['What is the largest continuous load a standard 20 A', ['12 A is 80 percent of a 15 A breaker.', '18 A is 90 percent, which is not the rule.', '20 A is permitted only for a load that is not continuous.']],
  ['A calculation gives a minimum rating of 112 A', ['110 A is a standard rating, but it is below the 112 A minimum.', '115 A is not a standard rating.', '120 A is not a standard rating.']],
  ["What must a circuit breaker's interrupting rating", ['Full-load current is far smaller than fault current. It is what the continuous rating is compared with.', 'Conductor ampacity governs the trip rating, not the interrupting rating.', 'The continuous rating is a different rating of the same device.']],
  ['How does a short-circuit current rating', ['They apply to different things: one to an assembly, the other to a single device.', 'Fuses and breakers both have interrupting ratings.', 'SCCR is about fault current, not continuous current.']],
  ['In a selectively coordinated system', ['That is exactly what coordination is meant to prevent.', 'Opening the main first would black out everything.', 'The device nearest the fault opens first, and it is normally the smallest.']],
  ['A breaker and its enclosure are listed', ['450 A is larger than a 100 percent rated device needs to be.', '500 A is what a standard, 80 percent rated breaker would need.', '600 A is larger than either rule requires.']],
  // 5 transformers
  ['What is the full-load secondary current of a 500 kVA', ['Leaves out the 1.732.', 'Divides by 1.732 twice.', 'Multiplies by 1.732 where it should divide.']],
  ['A 1,500 kVA, 480 V three-phase transformer has an impedance', ['This is the full-load current, before dividing by the impedance.', 'Multiplies by the impedance percentage where it should divide by the impedance as a fraction.', 'Leaves out the 1.732 when finding the full-load current.']],
  ['A three-phase load of 300 kW', ['225 kVA is below even the kW figure.', '300 kVA matches the kW, but the load is 333 kVA.', '750 kVA would carry it, but it is not the smallest that will.']],
  ['A 75 kVA three-phase transformer steps', ['This is the primary current, at 480 V.', 'Leaves out the 1.732.', 'Divides by 1.732 twice.']],
  ['Two transformers have the same kVA', ['Higher impedance holds fault current back more, so the 6 percent unit delivers less.', 'Impedance is the thing that sets the fault current.', 'This has both effects the wrong way round.']],
  ['A transformer nameplate shows the vector group', ['The capital D means the high-voltage winding is delta, and the number is a clock position, not a count of taps.', 'The letters describe winding connections, not the cooling type or the impedance.', 'The small y means the low-voltage winding is wye, and each clock hour is 30 degrees.']],
  ['What is a K-rated transformer', ['It tolerates harmonics. It does not filter them out.', 'Ambient temperature rating is a separate matter from K-factor.', 'Short-circuit withstand has nothing to do with K-factor.']],
  ["What does a transformer's BIL", ['BIL is an impulse rating, far above the continuous voltage.', 'That describes short-circuit withstand, a mechanical and thermal rating.', 'BIL is a voltage rating and has nothing to do with temperature.']],
  // 6 motors
  ['What is the synchronous speed of a four-pole', ['1,200 rpm is a six-pole motor at 60 Hz.', '1,500 rpm is a four-pole motor at 50 Hz.', '3,600 rpm is a two-pole motor at 60 Hz.']],
  ['A four-pole, 60 Hz induction motor runs at 1,750', ['Divides by the actual speed where it should divide by the synchronous speed.', 'This is the speed as a percentage of synchronous, not the slip.', 'Is a round figure, not the calculated slip.']],
  ['What torque does a 50 hp motor', ['This is the torque the same horsepower would need at half the speed.', 'This is the torque the same horsepower would need at twice the speed.', 'Divides horsepower by speed and leaves out the constant 5,252.']],
  ['What is the output of a 50 hp motor', ['Divides by 0.7457, which converts the wrong way.', 'Treats horsepower and kilowatts as the same unit.', 'Is not what the conversion factor gives.']],
  ['That 50 hp motor has a full-load efficiency', ['Multiplies by the efficiency. The input is always larger than the output.', 'This is the shaft output, with no allowance for losses.', 'Divides horsepower by efficiency with no conversion to kilowatts.']],
  ['What is the synchronous speed of a six-pole', ['750 rpm is an eight-pole motor at 50 Hz.', '1,200 rpm is the same six-pole motor on 60 Hz.', '1,500 rpm is a four-pole motor at 50 Hz.']],
  ['The three line-to-line voltages', ['Uses the spread between the highest and lowest readings, 17 V, which overstates it.', 'Uses a deviation of 3 V, which none of the three readings has.', 'Uses the 467 V reading, 8 V from the average. The 450 V reading is further away, at 9 V.']],
  ['A centrifugal fan in a system', ['80 percent is the flow, which goes directly with speed.', '64 percent is the pressure, which goes with the square of speed.', '40 percent has no basis in the affinity laws.']],
  // 7 data center power and cooling
  ['A data center draws 1,500 kW', ['This is the ratio upside down. PUE is never below 1.0.', 'Adds the two figures before dividing.', 'Divides the overhead by the IT load, which leaves the IT load itself out of the total.']],
  ['In that facility the overhead is 500 kW', ['Uses 8.76 where a year has 8,760 hours.', 'Uses the whole facility load where the question asks about the overhead.', 'Uses 876 hours, a tenth of a year.']],
  ['How many tons of sensible cooling', ['Divides kilowatts by 12, as though a ton were 12 kW.', 'Multiplies by 3.517 where it should divide.', 'Divides the BTU per hour by 10,000 where a ton is 12,000.']],
  ['A rack dissipates 10 kW', ['Is double the true figure, as if the temperature rise were 10&deg;F.', 'This is the airflow per kilowatt, not for the whole 10 kW rack.', 'Leaves out the 1.08 constant for air.']],
  ['A 100 ton cooling load', ['Uses 2 GPM per ton, where the figure at a 10&deg;F difference is 2.4.', 'Is a tenth of the true figure.', 'Leaves out the temperature difference.']],
  ['A cooling load needs three chillers', ['Four is N+1.', 'Five is N+2.', 'Eight has no basis. 2N is twice three.']],
  ['With hot aisle containment', ['That describes cold aisle containment.', 'Containment exists to keep the two air streams apart.', 'Containment changes the condition of the room completely.']],
  ['What is the essential difference between a CRAC', ['This has the two the wrong way round.', 'The difference is where the cooling comes from, not the rack density.', 'They differ in whether the unit has its own compressor.']],
  // 8 solar and storage
  ['An array has 240 modules', ['Is a tenth of the true figure, a slip of the decimal point.', 'Is ten times the true figure.', 'Is not what 240 times 540 gives.']],
  ['That 129.6 kWp array', ['This is the ratio upside down.', 'Has no basis in the two figures given.', 'This is the difference between the two figures in kilowatts, not their ratio.']],
  ['What is inverter clipping', ['Cable losses are a separate and much smaller effect.', 'Clipping happens at high output, not in low light.', 'Clipping is a normal operating condition and damages nothing.']],
  ['A battery is rated 100 Ah', ['Divides amp-hours by voltage where it should multiply.', 'This is the voltage, not the energy.', 'Is a tenth of the true figure, a slip of the decimal point.']],
  ['A storage project is rated 100 MW', ['Four is the duration in hours, the ratio upside down.', 'Is not what 100 divided by 400 gives.', 'Misplaces the decimal point in 0.25.']],
  ['A battery system is discharged at a steady 0.5C', ['30 minutes would be a rate of 2C.', 'One hour is a rate of 1C.', 'Four hours is a rate of 0.25C.']],
  ['A 100 Ah, 48 V battery may be discharged', ['Leaves out both the depth of discharge and the inverter efficiency.', 'Leaves out the inverter efficiency.', 'Leaves out the depth of discharge.']],
  ['A system must deliver 2,000 kWh', ['Multiplies by the two factors where it should divide.', 'Divides by only one of the two factors.', 'Ignores both the depth of discharge and the efficiency.']],
];
