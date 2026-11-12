import { Language } from '../types/physics';

export interface Translations {
  appTitle: string;
  institutionBadge: string;
  resetAll: string;
  langToggle: string;
  tabs: {
    module1: string;
    module1Short: string;
    module2: string;
    module2Short: string;
    module3: string;
    module3Short: string;
  };
  common: {
    controls: string;
    telemetry: string;
    play: string;
    pause: string;
    stepFrame: string;
    reset: string;
    running: string;
    paused: string;
    frozen: string;
  };
  m1: {
    stageTitle: string;
    temporalTitle: string;
    spatialTitle: string;
    pedagogicalRule: string;
    circularLabel: string;
    circularSub: string;
    oscillatoryLabel: string;
    oscillatorySub: string;
    asymmetricLabel: string;
    asymmetricSub: string;
    periodMarkerPulse: string;
    waveLabel: string;
    latticeLabel: string;
    rulerHint: string;
    identicalState: string;
    differentPhase: string;
    timePeriodLabel: string;
    wavelengthLabel: string;
    motionTypeLabel: string;
    motionOptions: {
      circular: string;
      oscillatory: string;
      asymmetric: string;
    };
    freezeTime: string;
    unfreezeTime: string;
    snapLambda: string;
    presetsLabel: string;
    presetFast: string;
    presetSlow: string;
    presetShortWave: string;
    telemetryTemporal: string;
    telemetrySpatial: string;
    elapsedTime: string;
    completedCycles: string;
    frequency: string;
    angularFreq: string;
    waveSpeed: string;
    cursor1: string;
    cursor2: string;
    deltaX: string;
    phaseDiff: string;
    stateMatch: string;
    keyInsightsTitle: string;
    insight1: string;
    insight2: string;
    insight3: string;
  };
  m2: {
    stageTitle: string;
    dragHint: string;
    holdingBlock: string;
    equilibrium: string;
    frictionlessTrack: string;
    springConstant: string;
    blockMass: string;
    initialAmplitude: string;
    springConfigLabel: string;
    configSingle: string;
    configParallel: string;
    configSeries: string;
    playbackLabel: string;
    releasePlay: string;
    stopAtEquilibrium: string;
    massDropBtn: string;
    massResetBtn: string;
    massDropNote: string;
    vectorsTitle: string;
    vecDisplacement: string;
    vecRestoringForce: string;
    vecVelocity: string;
    graphTitle: string;
    graphSubtitle: string;
    slopeNote: string;
    readoutsTitle: string;
    effectiveK: string;
    totalMass: string;
    angularFreq: string;
    timePeriod: string;
    frequency: string;
    displacement: string;
    velocity: string;
    restoringForce: string;
    acceleration: string;
    energyTitle: string;
    kineticEnergy: string;
    potentialEnergy: string;
    totalEnergy: string;
  };
  m3: {
    stageTitle: string;
    oscillatorTitle: string;
    oscilloscopeTitle: string;
    ghostLegend: string;
    activeLegend: string;
    dispTrace: string;
    accTrace: string;
    mirrorNote: string;
    forceLawLabel: string;
    linearLawTitle: string;
    linearLawFormula: string;
    linearLawDesc: string;
    hardSpringTitle: string;
    hardSpringFormula: string;
    hardSpringDesc: string;
    amplitudeLabel: string;
    omegaLabel: string;
    nonLinearityLabel: string;
    clearTrace: string;
    balancerTitle: string;
    equationHeader: string;
    liveSumLabel: string;
    residualLabel: string;
    balancedBadge: string;
    violatedBadge: string;
    checklistTitle: string;
    cond1: string;
    cond2: string;
    cond2Fail: string;
    cond3: string;
    isochronismTitle: string;
    linearPeriod: string;
    actualPeriod: string;
    isochronismTrue: string;
    isochronismFalse: string;
  };
}

export const TRANSLATIONS: Record<Language, Translations> = {
  bn: {
    appTitle: 'পর্যাবৃত্ত গতি, স্পন্দন ও আদর্শ স্প্রিং ল্যাব',
    institutionBadge: 'উদ্ভাস',
    resetAll: 'রিসেট',
    langToggle: 'English',
    tabs: {
      module1: 'মডিউল ১: কালিক ও স্থানিক পর্যাবৃত্তি',
      module1Short: '১. পর্যাবৃত্তি',
      module2: 'মডিউল ২: আদর্শ স্প্রিং-ভর ও প্রত্যয়নী বল',
      module2Short: '২. স্প্রিং ও বল',
      module3: 'মডিউল ৩: অন্তরক সমীকরণ ও দশা বৈশিষ্ট্য',
      module3Short: '৩. অন্তরক সমীকরণ',
    },
    common: {
      controls: 'নিয়ন্ত্রণ প্যানেল',
      telemetry: 'তাৎক্ষণিক পরিমাপ ও বিশ্লেষণ',
      play: 'চালু করুন',
      pause: 'বিরতি',
      stepFrame: 'ধাপ এগোন',
      reset: 'রিসেট',
      running: 'চলমান',
      paused: 'বিরতি',
      frozen: 'সময় স্থির',
    },
    m1: {
      stageTitle: 'কালিক বনাম স্থানিক পর্যাবৃত্তি স্টুডিও',
      temporalTitle: 'উপরের অংশ — কালিক পর্যাবৃত্তি (সময় T পরপর পুনরাবৃত্তি)',
      spatialTitle: 'নিচের অংশ — স্থানিক পর্যাবৃত্তি (দূরত্ব λ পরপর পুনরাবৃত্তি)',
      pedagogicalRule:
        'মূল নীতি: সকল স্পন্দন গতি পর্যাবৃত্ত গতি, কিন্তু সকল পর্যাবৃত্ত গতি স্পন্দন গতি নয়।',
      circularLabel: 'সুষম বৃত্তাকার গতি',
      circularSub: 'পর্যাবৃত্ত, কিন্তু স্পন্দন নয়',
      oscillatoryLabel: 'প্রতিসম স্পন্দন গতি (সরল দোলক)',
      oscillatorySub: 'পর্যাবৃত্ত ও সাম্যাবস্থানের দুই পাশে স্পন্দন',
      asymmetricLabel: 'অপ্রতিসম পর্যাবৃত্ত পালস (করাত-তরঙ্গ)',
      asymmetricSub: 'পর্যাবৃত্ত, কিন্তু সরল ছন্দিত স্পন্দন (SHM) নয়',
      periodMarkerPulse: 'পর্যায় চিহ্ন (T): ১টি পূর্ণ চক্র সম্পন্ন!',
      waveLabel: 'চলমান/স্থির তরঙ্গ শ্রেণি ψ(x, t)',
      latticeLabel: '১-মাত্রিক স্ফটিক পারমাণবিক জালিকা (স্থানিক পর্যাবৃত্তি)',
      rulerHint: 'স্কেলের x₁ ও x₂ কার্সর টেনে দূরত্ব Δx পরিমাপ করুন',
      identicalState: 'অভিন্ন ভৌত অবস্থা! Δx ≈ nλ',
      differentPhase: 'ভিন্ন দশা — দূরত্ব λ এর পূর্ণ গুণিতক নয়',
      timePeriodLabel: 'পর্যায়কাল (T)',
      wavelengthLabel: 'স্থানিক তরঙ্গদৈর্ঘ্য (λ)',
      motionTypeLabel: 'গতির ধরন নির্বাচন',
      motionOptions: {
        circular: 'বৃত্তাকার বনাম স্পন্দন',
        oscillatory: 'প্রতিসম স্পন্দন',
        asymmetric: 'অপ্রতিসম পর্যাবৃত্ত পালস',
      },
      freezeTime: 'সময় স্থির করুন (t = ধ্রুবক)',
      unfreezeTime: 'সময় সচল করুন',
      snapLambda: 'Δx = λ তে বসান',
      presetsLabel: 'দ্রুত প্রিসেট',
      presetFast: 'দ্রুত দোলন (T = 1.0 s)',
      presetSlow: 'ধীর দোলন (T = 4.0 s)',
      presetShortWave: 'ঘন তরঙ্গ (λ = 2.0 m)',
      telemetryTemporal: 'কালিক পরিমাপ',
      telemetrySpatial: 'স্থানিক স্কেল পরিমাপ',
      elapsedTime: 'অতিবাহিত সময় (t)',
      completedCycles: 'পূর্ণ চক্র (N)',
      frequency: 'কম্পাঙ্ক (f = 1/T)',
      angularFreq: 'কৌণিক কম্পাঙ্ক (ω)',
      waveSpeed: 'তরঙ্গ বেগ (v = λ/T)',
      cursor1: 'কার্সর x₁',
      cursor2: 'কার্সর x₂',
      deltaX: 'ব্যবধান (Δx)',
      phaseDiff: 'দশা পার্থক্য (Δφ)',
      stateMatch: 'অবস্থার মিল',
      keyInsightsTitle: 'তাত্ত্বিক সারসংক্ষেপ',
      insight1: 'কালিক পর্যাবৃত্তি: নির্দিষ্ট সময় T পরপর গতির পুনরাবৃত্তি ঘটে।',
      insight2: 'স্থানিক পর্যাবৃত্তি: নির্দিষ্ট দূরত্ব λ পরপর জালিকা ও তরঙ্গের গঠন একই থাকে।',
      insight3: 'স্পন্দন গতি: সাম্যাবস্থানের দুই পাশে নির্দিষ্ট পথে আসা-যাওয়া করে।',
    },
    m2: {
      stageTitle: 'ঘর্ষণহীন অনুভূমিক আদর্শ স্প্রিং-ভর পরীক্ষাগার',
      dragHint: 'ভরটিকে সরাসরি মাউস বা টাচ দিয়ে টেনে ধরে ছেড়ে দিন!',
      holdingBlock: 'স্থির অবস্থায় ধরে রাখা হয়েছে — প্রত্যয়নী বল পর্যবেক্ষণ করুন',
      equilibrium: 'সাম্যাবস্থান (x = 0)',
      frictionlessTrack: 'ঘর্ষণহীন বায়ু-ট্র্যাক (μ = 0)',
      springConstant: 'স্প্রিং ধ্রুবক (k)',
      blockMass: 'বস্তুর ভর (m)',
      initialAmplitude: 'প্রারম্ভিক বিস্তার (A)',
      springConfigLabel: 'স্প্রিং সমবায় পরীক্ষা',
      configSingle: 'একক (k)',
      configParallel: 'সমান্তরাল (2k)',
      configSeries: 'শ্রেণি (k/2)',
      playbackLabel: 'নিয়ন্ত্রণ',
      releasePlay: 'ছেড়ে দিন / চালু',
      stopAtEquilibrium: 'সাম্যাবস্থানে থামান',
      massDropBtn: '+1.0 kg ভর যোগ করুন (চলন্ত অবস্থায়)',
      massResetBtn: 'অতিরিক্ত +1.0 kg ভর সরান',
      massDropNote: 'চলন্ত অবস্থায় ভর যোগ হলে ভরবেগ সংরক্ষিত থাকে এবং T বাড়ে।',
      vectorsTitle: 'ভেক্টর প্রদর্শন',
      vecDisplacement: 'সরণ ভেক্টর (x⃗)',
      vecRestoringForce: 'প্রত্যয়নী বল (F⃗ = -kx⃗)',
      vecVelocity: 'বেগ ভেক্টর (v⃗)',
      graphTitle: 'প্রত্যয়নী বল বনাম সরণ (F - x) লেখচিত্র',
      graphSubtitle: 'মূলবিন্দুগামী সরলরেখা: ঢাল = -k',
      slopeNote: 'সবসময় সরণের বিপরীতমুখী',
      readoutsTitle: 'ডিজিটাল রিডআউট',
      effectiveK: 'কার্যকর স্প্রিং ধ্রুবক (kₑ)',
      totalMass: 'মোট ভর (m)',
      angularFreq: 'কৌণিক কম্পাঙ্ক (ω)',
      timePeriod: 'পর্যায়কাল (T)',
      frequency: 'কম্পাঙ্ক (f)',
      displacement: 'তাৎক্ষণিক সরণ (x)',
      velocity: 'তাৎক্ষণিক বেগ (v)',
      restoringForce: 'প্রত্যয়নী বল (F)',
      acceleration: 'ত্বরণ (a)',
      energyTitle: 'যান্ত্রিক শক্তি বণ্টন',
      kineticEnergy: 'গতিশক্তি (K)',
      potentialEnergy: 'বিভব শক্তি (U)',
      totalEnergy: 'মোট শক্তি (E)',
    },
    m3: {
      stageTitle: 'সরল ছন্দিত স্পন্দনের অন্তরক সমীকরণ ও সমকালিকতা',
      oscillatorTitle: 'উপরের অংশ — ত্বরণ ও সরণের বিপরীতমুখী সম্পর্ক (a বনাম x)',
      oscilloscopeTitle: 'নিচের অংশ — দ্বি-চ্যানেল অসিলোস্কোপ: x(t) ও a(t)',
      ghostLegend: 'আদর্শ SHM রেফারেন্স',
      activeLegend: 'বর্তমান দোলক',
      dispTrace: 'সরণ x(t)',
      accTrace: 'ত্বরণ a(t) = d²x/dt²',
      mirrorNote: 'লক্ষ্য করুন: x(t) যখন সর্বোচ্চ (+A), ত্বরণ a(t) তখন ঠিক সর্বনিম্ন (-a_max)',
      forceLawLabel: 'প্রত্যয়নী বলের সূত্র নির্বাচন',
      linearLawTitle: 'আদর্শ রৈখিক SHM',
      linearLawFormula: 'F = -kx',
      linearLawDesc: 'পর্যায়কাল T বিস্তারের ওপর নির্ভরশীল নয় (সমকালিকতা)।',
      hardSpringTitle: 'অ-রৈখিক হার্ড স্প্রিং',
      hardSpringFormula: 'F = -kx - βx³',
      hardSpringDesc: 'বিস্তার বাড়লে পর্যায়কাল কমে যায়; এটি বিশুদ্ধ SHM নয়।',
      amplitudeLabel: 'বিস্তার (A)',
      omegaLabel: 'স্বাভাবিক কৌণিক কম্পাঙ্ক (ω)',
      nonLinearityLabel: 'অ-রৈখিকতা গুণাঙ্ক (γ = β/m)',
      clearTrace: 'গ্রাফ মুছুন',
      balancerTitle: 'তাৎক্ষণিক অন্তরক সমীকরণ ব্যালেন্সার',
      equationHeader: 'd²x/dt² + ω²x = 0',
      liveSumLabel: 'তাৎক্ষণিক যোগফল [a(t)] + [ω²x(t)]',
      residualLabel: 'অ-রৈখিক বিচ্যুতি (-γx³)',
      balancedBadge: 'সঠিক: শূন্য সমতা (বিশুদ্ধ SHM)',
      violatedBadge: 'অশূন্য: SHM শর্ত লঙ্ঘিত',
      checklistTitle: 'SHM শর্ত যাচাইকরণ তালিকা',
      cond1: 'গতিটি পর্যাবৃত্ত ও স্পন্দন গতি',
      cond2: 'ত্বরণ সরণের সমানুপাতিক (a ∝ -x)',
      cond2Fail: 'ত্বরণ সরণের রৈখিক সমানুপাতিক নয় (-ω²x - γx³)',
      cond3: 'ত্বরণ সর্বদা সাম্যাবস্থান (x = 0) অভিমুখী',
      isochronismTitle: 'সমকালিকতা পরীক্ষা (Isochronism)',
      linearPeriod: 'তাত্ত্বিক রৈখিক পর্যায়কাল (T₀)',
      actualPeriod: 'প্রকৃত পরিমাপকৃত পর্যায়কাল (T)',
      isochronismTrue: 'বিস্তার A পরিবর্তন করলেও পর্যায়কাল T অপরিবর্তিত থাকে।',
      isochronismFalse: 'বিস্তার A বাড়ালে T কমে যাচ্ছে — সমকালিকতা ভঙ্গ হয়েছে!',
    },
  },
  en: {
    appTitle: 'Periodic Motion, Oscillation & Ideal Spring SHM Studio',
    institutionBadge: 'উদ্ভাস',
    resetAll: 'Reset',
    langToggle: 'বাংলা',
    tabs: {
      module1: 'Module 1: Temporal vs Spatial Periodicity',
      module1Short: '1. Periodicity',
      module2: 'Module 2: Ideal Spring-Mass & Restoring Force',
      module2Short: '2. Spring & Force',
      module3: 'Module 3: Differential Equation & SHM Conditions',
      module3Short: '3. Diff Equation',
    },
    common: {
      controls: 'Control Dock',
      telemetry: 'Live Telemetry & Analysis',
      play: 'Play',
      pause: 'Pause',
      stepFrame: 'Step Frame',
      reset: 'Reset',
      running: 'Running',
      paused: 'Paused',
      frozen: 'Time Frozen',
    },
    m1: {
      stageTitle: 'Temporal vs Spatial Periodicity Explorer',
      temporalTitle: 'Top Stage — Temporal Periodicity (Repeats every Time Period T)',
      spatialTitle: 'Bottom Stage — Spatial Periodicity (Repeats every Wavelength λ)',
      pedagogicalRule:
        'Core Rule: Every oscillatory motion is periodic, but not every periodic motion is oscillatory.',
      circularLabel: 'Uniform Circular Motion',
      circularSub: 'Periodic, NOT Oscillatory',
      oscillatoryLabel: 'Symmetrical Oscillation (Pendulum)',
      oscillatorySub: 'Periodic & Oscillatory about mean position',
      asymmetricLabel: 'Asymmetric Periodic Pulse (Sawtooth)',
      asymmetricSub: 'Periodic, but NOT Simple Harmonic Motion',
      periodMarkerPulse: 'Period Marker (T): 1 Full Cycle Complete!',
      waveLabel: 'Wave Train ψ(x, t)',
      latticeLabel: '1D Crystalline Atomic Lattice (Spatial Periodicity)',
      rulerHint: 'Drag cursors x₁ and x₂ along the x-axis to measure spacing Δx',
      identicalState: 'Identical Physical State! Δx ≈ nλ',
      differentPhase: 'Different Phase — Δx is not an integer multiple of λ',
      timePeriodLabel: 'Time Period (T)',
      wavelengthLabel: 'Spatial Wavelength (λ)',
      motionTypeLabel: 'Motion Type Switcher',
      motionOptions: {
        circular: 'Circular vs Oscillation',
        oscillatory: 'Symmetrical Oscillation',
        asymmetric: 'Asymmetric Periodic Pulse',
      },
      freezeTime: 'Freeze Time (t = const)',
      unfreezeTime: 'Resume Time',
      snapLambda: 'Snap Δx = λ',
      presetsLabel: 'Quick Presets',
      presetFast: 'Fast Cycle (T = 1.0 s)',
      presetSlow: 'Slow Cycle (T = 4.0 s)',
      presetShortWave: 'Dense Wave (λ = 2.0 m)',
      telemetryTemporal: 'Temporal Telemetry',
      telemetrySpatial: 'Spatial Ruler Telemetry',
      elapsedTime: 'Elapsed Time (t)',
      completedCycles: 'Completed Cycles (N)',
      frequency: 'Frequency (f = 1/T)',
      angularFreq: 'Angular Freq (ω)',
      waveSpeed: 'Wave Speed (v = λ/T)',
      cursor1: 'Cursor x₁',
      cursor2: 'Cursor x₂',
      deltaX: 'Separation (Δx)',
      phaseDiff: 'Phase Diff (Δφ)',
      stateMatch: 'Physical State',
      keyInsightsTitle: 'Key Physical Insights',
      insight1: 'Temporal periodicity: identical motion state repeats every T seconds.',
      insight2: 'Spatial periodicity: identical wave phase & lattice structure repeat every λ meters.',
      insight3: 'Oscillatory motion specifically moves to-and-fro about a mean equilibrium.',
    },
    m2: {
      stageTitle: 'Frictionless Horizontal Ideal Spring-Mass Lab',
      dragHint: 'Grab the mass block directly with mouse or touch, pull/compress, and release!',
      holdingBlock: 'Held Statically — Inspect Restoring Force vs Displacement',
      equilibrium: 'Equilibrium (x = 0)',
      frictionlessTrack: 'Frictionless Air-Track (μ = 0)',
      springConstant: 'Spring Constant (k)',
      blockMass: 'Block Mass (m)',
      initialAmplitude: 'Initial Amplitude (A)',
      springConfigLabel: 'Spring Configuration Test',
      configSingle: 'Single (k)',
      configParallel: 'Parallel (2k)',
      configSeries: 'Series (k/2)',
      playbackLabel: 'Playback Controls',
      releasePlay: 'Release / Play',
      stopAtEquilibrium: 'Stop at Equilibrium',
      massDropBtn: 'Drop +1.0 kg Mass onto Block',
      massResetBtn: 'Remove Extra +1.0 kg Mass',
      massDropNote: 'Inelastic drop conserves momentum (mv) and increases Period T.',
      vectorsTitle: 'Vector Overlays',
      vecDisplacement: 'Displacement (x⃗)',
      vecRestoringForce: 'Restoring Force (F⃗ = -kx⃗)',
      vecVelocity: 'Velocity (v⃗)',
      graphTitle: 'Restoring Force vs Displacement (F - x)',
      graphSubtitle: 'Linear line through origin: Slope = -k',
      slopeNote: 'Always opposes displacement',
      readoutsTitle: 'Digital Readouts',
      effectiveK: 'Effective Stiffness (kₑ)',
      totalMass: 'Total Mass (m)',
      angularFreq: 'Angular Freq (ω)',
      timePeriod: 'Time Period (T)',
      frequency: 'Frequency (f)',
      displacement: 'Displacement (x)',
      velocity: 'Velocity (v)',
      restoringForce: 'Restoring Force (F)',
      acceleration: 'Acceleration (a)',
      energyTitle: 'Mechanical Energy Split',
      kineticEnergy: 'Kinetic (K)',
      potentialEnergy: 'Elastic Potential (U)',
      totalEnergy: 'Total Energy (E)',
    },
    m3: {
      stageTitle: 'Differential Equation of SHM & Proportionality Lab',
      oscillatorTitle: 'Top — Synchronized Oscillator & Acceleration-Displacement Opposition',
      oscilloscopeTitle: 'Bottom — Live Dual-Trace Oscilloscope: x(t) & a(t)',
      ghostLegend: 'Pure Linear SHM Ghost',
      activeLegend: 'Active Oscillator',
      dispTrace: 'Displacement x(t)',
      accTrace: 'Acceleration a(t) = d²x/dt²',
      mirrorNote: 'Notice: a(t) is an exact inverted, ω²-scaled mirror of x(t) in linear SHM.',
      forceLawLabel: 'Restoring Force Law Selector',
      linearLawTitle: 'Pure Linear SHM',
      linearLawFormula: 'F = -kx',
      linearLawDesc: 'Period T is strictly independent of Amplitude A (Isochronism).',
      hardSpringTitle: 'Non-Linear Hard Spring',
      hardSpringFormula: 'F = -kx - βx³',
      hardSpringDesc: 'Period T shrinks as Amplitude A grows — violates pure SHM!',
      amplitudeLabel: 'Amplitude (A)',
      omegaLabel: 'Natural Angular Freq (ω)',
      nonLinearityLabel: 'Non-Linearity Factor (γ = β/m)',
      clearTrace: 'Clear Trace',
      balancerTitle: 'Live Differential Equation Balancer',
      equationHeader: 'd²x/dt² + ω²x = 0',
      liveSumLabel: 'Live Sum [a(t)] + [ω²x(t)]',
      residualLabel: 'Non-Linear Term (-γx³)',
      balancedBadge: 'Balanced: Zero Residual (Pure SHM)',
      violatedBadge: 'Non-Zero: SHM Condition Violated',
      checklistTitle: 'SHM Condition Verification Checklist',
      cond1: 'Motion is periodic & oscillatory',
      cond2: 'Acceleration is proportional to displacement (a ∝ -x)',
      cond2Fail: 'Acceleration is non-linear (-ω²x - γx³)',
      cond3: 'Acceleration is always directed toward mean position (x = 0)',
      isochronismTitle: 'Isochronism Check',
      linearPeriod: 'Linear SHM Period (T₀ = 2π/ω)',
      actualPeriod: 'Measured Oscillator Period (T)',
      isochronismTrue: 'Changing Amplitude A leaves Period T unchanged.',
      isochronismFalse: 'Increasing Amplitude A shortens Period T — Isochronism broken!',
    },
  },
};
