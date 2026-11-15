(() => {
  'use strict';

  /* =====================================================================
     1. ФИЗИКА
     ===================================================================== */

  const C = 3.00e8;        // скорость света, м/с (учебное округление, как в задании)
  const K_CIRC = 1.22;     // коэффициент круглой антенны (критерий Рэлея)
  const X_NULL = 3.8317;   // первый нуль функции Бесселя J1(x)
  const F_MIN = 1, F_MAX = 12;   // диапазон частот, ГГц
  const VIEW = 20;         // половина поля зрения «картинки антенны», градусы

  const rad2deg = r => r * 180 / Math.PI;
  const deg2rad = d => d * Math.PI / 180;

  /** Длина волны, м: λ = c / f (частота в ГГц) */
  const lambdaOf = g => C / (g * 1e9);
  /** Предел антенны (угловое разрешение по Рэлею), рад: θ ≈ 1,22 λ / D */
  const thetaOf = (g, D) => K_CIRC * lambdaOf(g) / D;

  /** Функция Бесселя J1(x) — рациональная аппроксимация (Numerical Recipes). */
  function besselJ1(x) {
    const ax = Math.abs(x);
    if (ax < 8) {
      const y = x * x;
      const p = x * (72362614232.0 + y * (-7895059235.0 + y * (242396853.1 + y * (-2972611.439 + y * (15704.48260 + y * -30.16036606)))));
      const q = 144725228442.0 + y * (2300535178.0 + y * (18583304.74 + y * (99447.43394 + y * (376.9991397 + y))));
      return p / q;
    }
    const z = 8 / ax, y = z * z, xx = ax - 2.356194491;
    const p = 1 + y * (0.183105e-2 + y * (-0.3516396496e-4 + y * (0.2457520174e-5 + y * -0.240337019e-6)));
    const q = 0.04687499995 + y * (-0.2002690873e-3 + y * (0.8449199096e-5 + y * (-0.88228987e-6 + y * 0.105787412e-6)));
    const v = Math.sqrt(0.636619772 / ax) * (Math.cos(xx) * p - z * Math.sin(xx) * q);
    return x < 0 ? -v : v;
  }

  /* Пятно Эйри: I(x) = [2·J1(x)/x]². Считаем один раз в таблицу, дальше — линейная интерполяция. */
  const LUT_N = 4000, LUT_MAX = 40;
  const AIRY = new Float32Array(LUT_N + 2);
  for (let i = 0; i <= LUT_N + 1; i++) {
    const x = i * LUT_MAX / LUT_N;
    AIRY[i] = x < 1e-6 ? 1 : Math.pow(2 * besselJ1(x) / x, 2);
  }
  function airy(x) {
    x = Math.abs(x);
    if (x >= LUT_MAX) return 0;
    const u = x * LUT_N / LUT_MAX, i = u | 0;
    return AIRY[i] + (AIRY[i + 1] - AIRY[i]) * (u - i);
  }
  /** Яркость одного объекта на угловом расстоянии d от его центра.
      Край пятна (первый нуль) попадает ровно на d = θ — как в формуле θ ≈ 1,22 λ/D. */
  const spot = (d, theta) => airy(X_NULL * d / theta);

  /** Наибольшая суммарная яркость двух объектов на расстоянии sep (нужна для нормировки картинки). */
  function pairPeak(sep, theta) {
    let peak = 0;
    for (let i = 0; i <= 120; i++) {
      const x = -sep / 2 + sep / 2 * i / 120;
      peak = Math.max(peak, spot(x + sep / 2, theta) + spot(x - sep / 2, theta));
    }
    return peak;
  }
  /** Итог: объекты видны раздельно / ровно на пределе / слились. */
  function stateOf(sep, theta) {
    const ratio = sep / theta;
    return ratio >= 1.015 ? 'resolved' : ratio >= 0.985 ? 'limit' : 'merged';
  }

  /* =====================================================================
     2. ТЕКСТЫ (қазақша / русский)
     ===================================================================== */

  const I18N = {
    kk: {
      brand: "Антенна зертханасы",
      nav1: "Түсіндірме", nav2: "Тәжірибе", nav3: "Формулалар", nav4: "Мысал", nav5: "Қорытынды",
      n1: "Түсіндірме.", n2: "Тәжірибе.", n3: "Формулалар.", n4: "Өмірден мысал.", n5: "Қорытынды.",
      meta1: "<b>Физика.</b> Есептік зертханалық жұмыс: параболалық антеннаның бұрыштық ажыратуы.",
      meta2: "<b>Берілгені.</b> Антенна диаметрі 0,8 м, жұмыс жиілігі 3 ГГц.",
      heroTitle: "Антенна қаншалықты өткір көреді.",
      heroQ: "Аспандағы екі көрші нысанды антенна қашан <b>бір дақ емес, екеу</b> деп көреді?",
      heroCta: "Тәжірибеге өту", demoBtn: "Мысалды көрсету", resetBtn: "Тәжірибені қалпына келтіру",
      answer: "Тапсырманың жауабы<br><b>θ ≈ 0,153 рад ≈ 8,74°</b>",
      hs_resolved: "бөлек көрінеді", hs_limit: "дәл шекте", hs_merged: "бір дақ",

      exTitle: "Антенна неге «бұлдыр» көреді.",
      exLede: "Түнгі жолда алыстан келе жатқан көлікті елестетіңіз. Алыстан екі фарасы бір жарық болып көрінеді. Көлік жақындағанда екі фараны бөлек көресіз. Антеннада да солай: бір-біріне тым жақын тұрған екі алыс нысанды ол біреу деп қабылдайды.",
      ex1t: "Толқын мүлтіксіз түзу жүрмейді",
      ex1p: "Радиотолқын «тарелкаға» түскенде шеттерінде сәл жайылады. Бұл барлық толқынға тән қасиет, оны дифракция дейді.",
      ex2t: "Сондықтан нүкте дақ болып көрінеді",
      ex2p: "Алыстағы жұлдыз немесе спутник антенна үшін нүкте емес, бұлдыр дақ. Дақ неғұрлым кіші болса, антеннаның «көзі» соғұрлым өткір.",
      ex3t: "Екі дақ бірігіп кетуі мүмкін",
      ex3p: "Нысандар тым жақын тұрса, дақтары қабаттасып, біреу болып көрінеді. Нысандар әлі бөлек көрінетін ең кіші бұрышты <var>θ</var> (тета) деп белгілейді. Бұл — антеннаның шегі.",
      exRemember: "<b>Есте сақтаңыз.</b> <var>θ</var> неғұрлым кіші болса, соғұрлым жақсы. Оны кішірейтудің екі жолы бар: толқынды қысқарту (жиілікті арттыру) немесе антеннаны үлкейту.",

      labTitle: "Өзіңіз тексеріп көріңіз.",
      labLede: "Үш жүгірткіні жылжытыңыз да, антенна екі нысанды қалай көретінін бақылаңыз.",
      skyTitle: "Антенна көретін сурет",
      skyHint: "Сары сақина — A дағының шеті. Оның радиусы θ-ға тең.",
      cF: "Жиілік", cFh: "Жиілік жоғары болса, толқын қысқарады, сурет өткірленеді.",
      cD: "Антенна диаметрі", cDh: "Антенна үлкен болса, сурет өткірленеді.",
      cS: "Екі нысанның арасы", cSh: "Аспандағы екі нысанның арасындағы бұрыш, Δ.",
      rLam: "Толқын ұзындығы, λ", rTheta: "Антеннаның шегі, θ",
      warnAngle: "θ 30°-тан үлкен: мұндай жағдайда формула тек шамамен баға береді.",
      vd_resolved: "Екі нысан бөлек көрінеді", vs_resolved: "Арасы (Δ) антеннаның шегінен (θ) үлкен.",
      vd_limit: "Дәл шекте: әрең ажыратылады", vs_limit: "Δ = θ. Мұны Рэлей шегі деп атайды.",
      vd_merged: "Бір дақ болып көрінеді", vs_merged: "Арасы (Δ) антеннаның шегінен (θ) кіші.",
      schemeTitle: "Бүйірінен қарағанда",
      sn_resolved: "B нысаны сәуледен тыс тұр, сондықтан антенна A нысанын бөлек қабылдайды.",
      sn_limit: "B нысаны сәуленің дәл шетінде тұр.",
      sn_merged: "B нысаны сәуленің ішінде: екі сигнал араласып кетеді.",
      graphTitle: "Жиілік артса, шек кішірейеді",
      graphNote: "Графикті басып, жиілікті таңдауға болады.",
      axF: "жиілік, ГГц", axT: "шек θ, °", scWave: "толқын ұзындығы", scBeam: "сәуле",
      capDefault: "Бастапқы күй — тапсырмадағы мәндер: 3 ГГц және 0,8 м. Екі нысан дәл шекте тұр.",
      cap_d1: "1 ГГц. Толқын ұзын (30 см), дақтар үлкен: екі нысан бір дақ болып көрінеді.",
      cap_d3: th => `3 ГГц. Толқын 10 см, шек θ ≈ ${th}°. Нысандар дәл шекте: әрең ажыратылады.`,
      cap_d6: th => `6 ГГц. Толқын 5 см, шек екі есе кішірейді (θ ≈ ${th}°): екі нысан анық бөлек көрінеді.`,
      cap_dEnd: "Тапсырманың жауабы: 3 ГГц пен 0,8 м үшін θ ≈ 0,153 рад ≈ 8,74°.",
      cap_sat: th => `Спутниктік антенна: 12 ГГц, 0,8 м, θ ≈ ${th}°. Арасы 3° болатын көрші спутниктер бөлек көрінеді.`,

      fTitle: "Екі формула.",
      fLede: "Бүкіл есеп екі қадамнан тұрады: алдымен толқын ұзындығын, содан кейін антеннаның шегін табамыз.",
      inSim: "Тәжірибеде",
      f1v: "<li><var>λ</var> — толқын ұзындығы, метрмен</li><li><var>c</var> — жарық жылдамдығы, 3,00 × 10⁸ м/с</li><li><var>f</var> — жиілік, герцпен</li>",
      f1s: "Жиілік жүгірткісі λ-ны өзгертеді: жиілік жоғары болса, толқын қысқа.",
      f2v: "<li><var>θ</var> — антеннаның шегі, радианмен</li><li>1,22 — дөңгелек антеннаға арналған тұрақты сан</li><li><var>D</var> — антенна диаметрі, метрмен</li>",
      f2s: "θ — суреттегі сары сақинаның радиусы және сызбадағы сәуленің жарты ені.",
      calcTitle: "Есептеу · жүгірткілердегі мәндермен",

      mTitle: "Шатырдағы спутниктік антенна.",
      m1: "Үй шатырындағы спутниктік «тарелка» — дәл осындай параболалық антенна. Ол шамамен 12 ГГц жиілікте жұмыс істейді, диаметрі 0,8 м шамасында. Сонда <var>θ</var> ≈ 2,2°.",
      m2: "Аспандағы көрші спутниктердің арасы небәрі бірнеше градус. Сәуле осындай тар болғандықтан антенна тек өз спутнигін «естиді». 3 ГГц жиілікте сол антеннаның шегі 8,7° болып, бірнеше спутниктің сигналы араласар еді.",
      mBtn: "Тәжірибеде көру",
      beamCap: (g, th, n) => `<b>${g} ГГц · θ ≈ ${th}°</b> — сәулеге ${n} спутник түседі${n === 1 ? ': антенна тек өз спутнигін естиді.' : ', сигналдар араласады.'}`,

      qTitle: "Қорытынды.", qLede: "Сабақта ауызша айтуға арналған қысқа нұсқа.",
      q1: "Антенна екі алыс нысанды бөлек көруі үшін олардың арасындағы бұрыш белгілі бір шектен үлкен болуы керек. Бұл шек <var>θ</var> ≈ 1,22 <var>λ</var> / <var>D</var> формуласымен есептеледі.",
      q2: "Диаметрі 0,8 м антенна 3 ГГц жиілікте жұмыс істесе, толқын ұзындығы 10 см, ал <var>θ</var> ≈ 0,153 рад, яғни шамамен 8,74°.",
      q3: "Жиілікті арттырса немесе антеннаны үлкейтсе, <var>θ</var> кішірейеді және антенна «өткірлеу» көреді.",
      qLimit: "Бұл — идеал антеннаға арналған жуық есеп. Нақты антеннада беттің дәлсіздігі мен шу да әсер етеді.",
      foot: "Оқу мақсатындағы мәндер: жарық жылдамдығы c = 3,00 × 10⁸ м/с деп дөңгелектелген; жүгірткілердің ауқымдары, спутник мысалындағы 12 ГГц пен 3° қадам шамамен алынған. Модель идеал дөңгелек антеннаға және кіші бұрыштарға арналған."
    },
    ru: {
      brand: "Лаборатория антенны",
      nav1: "Объяснение", nav2: "Эксперимент", nav3: "Формулы", nav4: "Пример", nav5: "Вывод",
      n1: "Объяснение.", n2: "Эксперимент.", n3: "Формулы.", n4: "Пример из жизни.", n5: "Вывод.",
      meta1: "<b>Физика.</b> Расчётная лабораторная работа: угловое разрешение параболической антенны.",
      meta2: "<b>Дано.</b> Диаметр антенны 0,8 м, рабочая частота 3 ГГц.",
      heroTitle: "Насколько остро видит антенна.",
      heroQ: "Когда антенна видит два соседних объекта на небе <b>не одним пятном, а двумя</b>?",
      heroCta: "Перейти к эксперименту", demoBtn: "Показать пример", resetBtn: "Сбросить эксперимент",
      answer: "Ответ задания<br><b>θ ≈ 0,153 рад ≈ 8,74°</b>",
      hs_resolved: "видны раздельно", hs_limit: "ровно на пределе", hs_merged: "одно пятно",

      exTitle: "Почему антенна видит «размыто».",
      exLede: "Представьте машину далеко на ночной дороге. Издалека две её фары сливаются в один огонёк. Машина подъезжает, и вы видите уже две фары. У антенны то же самое: два далёких объекта, стоящих слишком близко друг к другу, она принимает за один.",
      ex1t: "Волна не идёт идеально ровно",
      ex1p: "Попадая в «тарелку», радиоволна немного расплывается у краёв. Это свойство любых волн, его называют дифракцией.",
      ex2t: "Поэтому точка выглядит пятном",
      ex2p: "Далёкая звезда или спутник для антенны не точка, а размытое пятно. Чем меньше пятно, тем острее «зрение» антенны.",
      ex3t: "Два пятна могут слиться",
      ex3p: "Если объекты стоят слишком близко, их пятна накладываются и выглядят как одно. Наименьший угол, при котором объекты ещё видны раздельно, обозначают <var>θ</var> (тета). Это предел антенны.",
      exRemember: "<b>Запомните.</b> Чем меньше <var>θ</var>, тем лучше. Уменьшить его можно двумя способами: взять волну короче (повысить частоту) или антенну больше.",

      labTitle: "Проверьте сами.",
      labLede: "Двигайте три ползунка и смотрите, как антенна видит два объекта.",
      skyTitle: "Что видит антенна",
      skyHint: "Жёлтое кольцо — край пятна A. Его радиус равен θ.",
      cF: "Частота", cFh: "Чем выше частота, тем короче волна и резче картинка.",
      cD: "Диаметр антенны", cDh: "Чем больше антенна, тем резче картинка.",
      cS: "Расстояние между объектами", cSh: "Угол между двумя объектами на небе, Δ.",
      rLam: "Длина волны, λ", rTheta: "Предел антенны, θ",
      warnAngle: "θ больше 30°: в таком случае формула даёт только грубую оценку.",
      vd_resolved: "Два объекта видны раздельно", vs_resolved: "Расстояние между ними (Δ) больше предела антенны (θ).",
      vd_limit: "Ровно на пределе: едва различимы", vs_limit: "Δ = θ. Это называют пределом Рэлея.",
      vd_merged: "Видны как одно пятно", vs_merged: "Расстояние между ними (Δ) меньше предела антенны (θ).",
      schemeTitle: "Вид сбоку",
      sn_resolved: "Объект B стоит вне луча, поэтому антенна принимает объект A отдельно.",
      sn_limit: "Объект B стоит ровно на краю луча.",
      sn_merged: "Объект B внутри луча: два сигнала смешиваются.",
      graphTitle: "Чем выше частота, тем меньше предел",
      graphNote: "Нажмите на график, чтобы выбрать частоту.",
      axF: "частота, ГГц", axT: "предел θ, °", scWave: "длина волны", scBeam: "луч",
      capDefault: "Исходное состояние — значения из задания: 3 ГГц и 0,8 м. Два объекта стоят ровно на пределе.",
      cap_d1: "1 ГГц. Волна длинная (30 см), пятна большие: два объекта видны как одно пятно.",
      cap_d3: th => `3 ГГц. Волна 10 см, предел θ ≈ ${th}°. Объекты ровно на пределе: едва различимы.`,
      cap_d6: th => `6 ГГц. Волна 5 см, предел стал вдвое меньше (θ ≈ ${th}°): два объекта видны чётко раздельно.`,
      cap_dEnd: "Ответ задания: для 3 ГГц и 0,8 м θ ≈ 0,153 рад ≈ 8,74°.",
      cap_sat: th => `Спутниковая антенна: 12 ГГц, 0,8 м, θ ≈ ${th}°. Соседние спутники через 3° видны раздельно.`,

      fTitle: "Две формулы.",
      fLede: "Весь расчёт состоит из двух шагов: сначала находим длину волны, потом предел антенны.",
      inSim: "В эксперименте",
      f1v: "<li><var>λ</var> — длина волны, в метрах</li><li><var>c</var> — скорость света, 3,00 × 10⁸ м/с</li><li><var>f</var> — частота, в герцах</li>",
      f1s: "Ползунок частоты меняет λ: чем выше частота, тем короче волна.",
      f2v: "<li><var>θ</var> — предел антенны, в радианах</li><li>1,22 — постоянное число для круглой антенны</li><li><var>D</var> — диаметр антенны, в метрах</li>",
      f2s: "θ — радиус жёлтого кольца на картинке и половина ширины луча на схеме.",
      calcTitle: "Расчёт · со значениями ползунков",

      mTitle: "Спутниковая антенна на крыше.",
      m1: "Спутниковая «тарелка» на крыше дома — такая же параболическая антенна. Она работает на частоте около 12 ГГц, её диаметр около 0,8 м. Тогда <var>θ</var> ≈ 2,2°.",
      m2: "Соседние спутники стоят на небе всего в нескольких градусах друг от друга. Луч такой узкий, что антенна «слышит» только свой спутник. На частоте 3 ГГц предел той же антенны был бы 8,7°, и сигналы нескольких спутников смешались бы.",
      mBtn: "Посмотреть в эксперименте",
      beamCap: (g, th, n) => {
        const w = n % 10 === 1 && n % 100 !== 11 ? 'спутник' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'спутника' : 'спутников';
        return `<b>${g} ГГц · θ ≈ ${th}°</b> — в луч ${n === 1 ? 'попадает' : 'попадают'} ${n} ${w}${n === 1 ? ': антенна слышит только свой спутник.' : ', сигналы смешиваются.'}`;
      },

      qTitle: "Вывод.", qLede: "Короткая версия для устного пересказа на уроке.",
      q1: "Чтобы антенна видела два далёких объекта раздельно, угол между ними должен быть больше определённого предела. Этот предел считают по формуле <var>θ</var> ≈ 1,22 <var>λ</var> / <var>D</var>.",
      q2: "Если антенна диаметром 0,8 м работает на частоте 3 ГГц, длина волны равна 10 см, а <var>θ</var> ≈ 0,153 рад, то есть около 8,74°.",
      q3: "Если повысить частоту или увеличить антенну, <var>θ</var> уменьшится, и антенна будет видеть «острее».",
      qLimit: "Это приближённый расчёт для идеальной антенны. У реальной влияют ещё неточность поверхности и шум.",
      foot: "Учебные значения: скорость света округлена до c = 3,00 × 10⁸ м/с; диапазоны ползунков, 12 ГГц и шаг 3° в примере со спутником взяты приблизительно. Модель рассчитана на идеальную круглую антенну и малые углы."
    }
  };

  /* =====================================================================
     3. СОСТОЯНИЕ И ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
     ===================================================================== */

  const DEFAULTS = { f: 3.0, D: 0.8 };
  DEFAULTS.sep = rad2deg(thetaOf(DEFAULTS.f, DEFAULTS.D));   // по умолчанию объекты ровно на пределе

  const S = { ...DEFAULTS };
  const $ = id => document.getElementById(id);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Язык: казахский по умолчанию; выбор запоминается в браузере (если хранилище доступно)
  let lang = 'kk';
  try { const saved = localStorage.getItem('antenna_lang'); if (saved && I18N[saved]) lang = saved; } catch (e) {}
  const t = key => I18N[lang][key];

  const css = getComputedStyle(document.documentElement);
  const COLOR = {};
  for (const k of ['bg', 'panel', 'line', 'line-soft', 'fg', 'muted', 'dim', 'accent']) COLOR[k] = css.getPropertyValue('--' + k).trim();
  const FONT_MONO = '"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace';

  /** Число с десятичной запятой. Множитель (1 + 1e-9) убирает двоичную погрешность: 0,1525 → 0,153. */
  const fmt = (v, d) => (v * (1 + 1e-9)).toFixed(d).replace('.', ',').replace('-', '−');
  /** 3,0 × 10⁹ */
  function sci(v, d) {
    const e = Math.floor(Math.log10(v)), m = v / Math.pow(10, e);
    return `${fmt(m, d)} × 10${String(e).replace(/[0-9]/g, ch => '⁰¹²³⁴⁵⁶⁷⁸⁹'[ch])}`;
  }
  /** Подгоняет внутренний размер холста под экран и плотность пикселей. */
  function fit(cv) {
    const r = cv.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.round(r.width * dpr), H = Math.round(r.height * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, r.width, r.height);
    return { ctx, w: r.width, h: r.height };
  }
  function niceCeil(v, list) { for (const c of list) if (c >= v) return c; return list[list.length - 1]; }

  /* =====================================================================
     4. КАРТИНКА «ЧТО ВИДИТ АНТЕННА»: два пятна Эйри
     ===================================================================== */

  // Шкала яркости: чёрный → серый → тёплый белый (как снимок звёзд)
  const RAMP = (() => {
    const stops = [[0, 10, 10, 10], [0.25, 46, 46, 47], [0.55, 128, 128, 125], [0.8, 206, 204, 196], [1, 255, 253, 244]];
    const out = new Uint8Array(256 * 3);
    for (let i = 0; i < 256; i++) {
      const u = i / 255; let k = 0; while (k < stops.length - 2 && u > stops[k + 1][0]) k++;
      const a = stops[k], b = stops[k + 1], w = Math.min(1, Math.max(0, (u - a[0]) / (b[0] - a[0])));
      for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.round(a[c + 1] + (b[c + 1] - a[c + 1]) * w);
    }
    return out;
  })();

  /** Создаёт рисовальщик: считает картину на маленькой сетке и растягивает на весь холст.
      view — половина поля зрения по горизонтали (в тех же единицах, что sep и theta). */
  function makeAiryRenderer(nx) {
    const off = document.createElement('canvas'), octx = off.getContext('2d');
    return function (ctx, w, h, view, sep, theta) {
      const ny = Math.max(8, Math.round(nx * h / w));
      if (off.width !== nx || off.height !== ny) { off.width = nx; off.height = ny; }
      const img = octx.createImageData(nx, ny), data = img.data;
      const step = 2 * view / nx, norm = pairPeak(sep, theta);
      for (let j = 0; j < ny; j++) {
        const dy = (j + 0.5 - ny / 2) * step;
        for (let i = 0; i < nx; i++) {
          const dx = (i + 0.5 - nx / 2) * step;
          const I = spot(Math.hypot(dx + sep / 2, dy), theta) + spot(Math.hypot(dx - sep / 2, dy), theta);
          // степень 0,65 сжимает шкалу яркости: видны и слабые кольца, и провал между пятнами
          const v = Math.min(255, Math.round(255 * Math.pow(Math.min(1, I / norm), 0.65))), p = (j * nx + i) * 4;
          data[p] = RAMP[v * 3]; data[p + 1] = RAMP[v * 3 + 1]; data[p + 2] = RAMP[v * 3 + 2]; data[p + 3] = 255;
        }
      }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, w, h);
    };
  }

  const renderSky = makeAiryRenderer(200);

  /** Подпись с тёмной обводкой — читается и на ярком пятне, и на чёрном фоне. */
  function outlined(ctx, text, x, y, color) {
    ctx.lineWidth = 4; ctx.strokeStyle = COLOR.bg; ctx.lineJoin = 'round';
    ctx.strokeText(text, x, y); ctx.fillStyle = color; ctx.fillText(text, x, y);
  }

  function drawSky() {
    const g = fit($('sky')); if (!g) return;
    const { ctx, w, h } = g;
    const theta = rad2deg(thetaOf(S.f, S.D));
    renderSky(ctx, w, h, VIEW, S.sep, theta);

    const ppd = w / (2 * VIEW), cx = w / 2, cy = h / 2;      // ppd — пикселей на градус
    const xA = cx - S.sep / 2 * ppd, xB = cx + S.sep / 2 * ppd;

    // Жёлтое кольцо: край пятна A (радиус θ). Если центр B лежит на кольце — это предел.
    ctx.setLineDash([5, 5]); ctx.lineWidth = 1.4; ctx.strokeStyle = COLOR.accent;
    ctx.beginPath(); ctx.arc(xA, cy, theta * ppd, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);

    // Метки объектов A и B под пятнами
    ctx.font = `500 13px ${FONT_MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const my = h * 0.79;
    const mark = (x, name) => {
      ctx.strokeStyle = COLOR.fg; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, my - 22); ctx.lineTo(x, my - 12); ctx.stroke();
      outlined(ctx, name, x, my, COLOR.fg);
    };
    if (xB - xA > 20) { mark(xA, 'A'); mark(xB, 'B'); } else { mark(cx, 'A · B'); }

    // Масштабный отрезок 10° вверху
    const sy = h * 0.2, sl = 10 * ppd;
    ctx.strokeStyle = COLOR.muted; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - sl / 2, sy); ctx.lineTo(cx + sl / 2, sy);
    ctx.moveTo(cx - sl / 2, sy - 4); ctx.lineTo(cx - sl / 2, sy + 4); ctx.moveTo(cx + sl / 2, sy - 4); ctx.lineTo(cx + sl / 2, sy + 4); ctx.stroke();
    ctx.font = `400 11px ${FONT_MONO}`; outlined(ctx, '10°', cx, sy - 12, COLOR.muted);
  }

  /* =====================================================================
     5. СХЕМА «ВИД СБОКУ»: антенна, луч, объекты A и B
     ===================================================================== */

  let wavePhase = 0;   // сдвиг волновых фронтов, px (анимация)

  function drawScheme() {
    const g = fit($('scheme')); if (!g) return;
    const { ctx, w, h } = g;
    const lam = lambdaOf(S.f), th = thetaOf(S.f, S.D);
    const thDraw = Math.min(th, 1.45);       // на рисунке не шире ±83°
    const sep = deg2rad(S.sep);

    // Общий масштаб для антенны и длины волны: антенна 3 м занимает 78 % высоты холста
    const k = h * 0.78 / 3;                  // px на метр
    const a = S.D * k / 2;                   // половина диаметра, px
    const F = 0.4 * S.D * k;                 // фокусное расстояние (F/D = 0,4 — учебное значение)
    const depth = a * a / (4 * F);           // глубина зеркала
    const ax = Math.max(40, w * 0.09), cy = h * 0.42;
    const O = { x: ax + depth, y: cy };      // вершина углов на схеме

    // Расстояние до объектов на рисунке (не в масштабе: на самом деле они очень далеко)
    const Lmax = w - O.x - 30;
    const L = sep > 1e-3 ? Math.min(Lmax, (h - cy - 26) / Math.sin(sep)) : Lmax;
    const far = w + h;

    /* Луч антенны: от оси до края ±θ */
    ctx.beginPath(); ctx.moveTo(O.x, O.y);
    ctx.lineTo(O.x + far * Math.cos(thDraw), O.y - far * Math.sin(thDraw));
    ctx.lineTo(O.x + far * Math.cos(thDraw), O.y + far * Math.sin(thDraw));
    ctx.closePath();
    const beam = ctx.createLinearGradient(O.x, 0, w, 0);
    beam.addColorStop(0, 'rgba(255,210,31,.26)'); beam.addColorStop(1, 'rgba(255,210,31,.04)');
    ctx.fillStyle = beam; ctx.fill();

    // Волновые фронты: расстояние между ними равно λ в масштабе рисунка.
    // Если λ на экране меньше 5 px, рисуем каждый n-й фронт, чтобы линии не слиплись.
    let stepPx = lam * k, nth = 1;
    while (stepPx * nth < 5) nth++;
    stepPx *= nth;
    ctx.lineWidth = 1; ctx.strokeStyle = COLOR.accent;
    for (let r = F + (wavePhase % stepPx); r < w; r += stepPx) {
      ctx.globalAlpha = Math.max(0, 0.5 * (1 - r / (w - O.x)));
      ctx.beginPath(); ctx.arc(O.x, O.y, r, -thDraw, thDraw); ctx.stroke();
    }
    ctx.globalAlpha = 0.75;
    for (const sgn of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(O.x, O.y);
      ctx.lineTo(O.x + far * Math.cos(thDraw), O.y + sgn * far * Math.sin(thDraw)); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    /* Объекты: A на оси антенны, B под углом Δ */
    const A = { x: O.x + L, y: O.y };
    const B = { x: O.x + L * Math.cos(sep), y: O.y + L * Math.sin(sep) };
    ctx.setLineDash([4, 5]); ctx.lineWidth = 1; ctx.strokeStyle = COLOR.muted;
    ctx.beginPath(); ctx.moveTo(O.x, O.y); ctx.lineTo(A.x, A.y); ctx.moveTo(O.x, O.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    ctx.setLineDash([]);
    const star = (p, name, dy) => {
      const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 13);
      gr.addColorStop(0, 'rgba(243,243,240,.9)'); gr.addColorStop(0.3, 'rgba(243,243,240,.35)'); gr.addColorStop(1, 'rgba(243,243,240,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p.x, p.y, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = COLOR.fg; ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.font = `500 13px ${FONT_MONO}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      outlined(ctx, name, p.x + 11, p.y + dy, COLOR.fg);
    };
    star(A, 'A', -11); star(B, 'B', 11);

    /* Дуги углов: θ (сверху, жёлтая) и Δ (снизу, белая) */
    ctx.font = `500 12px ${FONT_MONO}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    const r1 = Math.min(L * 0.42, 120);
    ctx.strokeStyle = COLOR.accent; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(O.x, O.y, r1, -thDraw, 0); ctx.stroke();
    const tl = { x: O.x + (r1 + 8) * Math.cos(thDraw / 2), y: O.y - (r1 + 8) * Math.sin(thDraw / 2) };
    outlined(ctx, `θ = ${fmt(rad2deg(th), 2)}°`, Math.min(tl.x, w - 92), Math.max(12, tl.y - 4), COLOR.accent);
    if (sep > 0.004) {
      const r2 = L * 0.74;
      ctx.strokeStyle = COLOR.fg; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(O.x, O.y, r2, 0, sep); ctx.stroke();
      const dl = { x: O.x + (r2 + 8) * Math.cos(sep / 2), y: O.y + (r2 + 8) * Math.sin(sep / 2) };
      outlined(ctx, `Δ = ${fmt(S.sep, 2)}°`, Math.min(dl.x, w - 92), Math.min(h - 12, dl.y + 6), COLOR.fg);
    }

    /* Антенна: параболическое зеркало, приёмник в фокусе, опора */
    ctx.strokeStyle = COLOR.muted; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(O.x, cy - a); ctx.lineTo(ax + F, cy); ctx.lineTo(O.x, cy + a); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax, cy); ctx.lineTo(ax - 12, cy); ctx.lineTo(ax - 12, cy + Math.max(a + 14, 26)); ctx.stroke();
    ctx.strokeStyle = COLOR.fg; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const y = -a + 2 * a * i / 40, x = ax + y * y / (4 * F);
      i ? ctx.lineTo(x, cy + y) : ctx.moveTo(x, cy + y);
    }
    ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = COLOR.accent; ctx.beginPath(); ctx.arc(ax + F, cy, 3.5, 0, Math.PI * 2); ctx.fill();

    /* Подписи: диаметр и длина волны (в одном масштабе с антенной) */
    ctx.font = `400 11px ${FONT_MONO}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = COLOR.muted;
    ctx.fillText(`D = ${fmt(S.D, 2)} м`, 10, Math.max(10, cy - a - 14));
    const by = h - 14, bl = Math.max(2, lam * k);
    ctx.strokeStyle = COLOR.accent; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(10, by); ctx.lineTo(10 + bl, by); ctx.stroke();
    ctx.fillStyle = COLOR.muted;
    ctx.fillText(`${t('scWave')} λ = ${fmt(lam * 100, lam < 0.1 ? 2 : 1)} см`, 18 + bl, by);
  }

  /* =====================================================================
     6. ГРАФИК: предел θ в зависимости от частоты
     ===================================================================== */

  let graphGeom = null;   // геометрия области графика — нужна для выбора частоты нажатием

  function drawGraph() {
    const g = fit($('graph')); if (!g) return;
    const { ctx, w, h } = g;
    const P = { l: 44, r: 16, t: 26, b: 38 }, pw = w - P.l - P.r, ph = h - P.t - P.b;
    const thDeg = f => rad2deg(thetaOf(f, S.D));
    const yMax = niceCeil(thDeg(F_MIN) * 1.04, [5, 10, 15, 20, 30, 40, 60, 80, 100]);
    const X = f => P.l + (f - F_MIN) / (F_MAX - F_MIN) * pw;
    const Y = v => P.t + ph - v / yMax * ph;
    graphGeom = { l: P.l, pw };

    // Сетка и подписи осей
    ctx.lineWidth = 1; ctx.strokeStyle = COLOR['line-soft']; ctx.fillStyle = COLOR.muted; ctx.font = `400 11px ${FONT_MONO}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    for (const f of (pw < 360 ? [1, 3, 5, 7, 9, 11] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])) {
      ctx.beginPath(); ctx.moveTo(X(f) + 0.5, P.t); ctx.lineTo(X(f) + 0.5, P.t + ph); ctx.stroke();
      ctx.fillText(String(f), X(f), P.t + ph + 15);
    }
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const v = yMax * i / 4;
      ctx.beginPath(); ctx.moveTo(P.l, Y(v) + 0.5); ctx.lineTo(P.l + pw, Y(v) + 0.5); ctx.stroke();
      ctx.fillText(fmt(v, v % 1 ? 1 : 0), P.l - 6, Y(v));
    }
    ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; ctx.fillText(t('axF'), P.l + pw, P.t + ph + 31);
    ctx.textAlign = 'left'; ctx.fillText(t('axT'), 8, 14);

    // Кривая θ(f): убывающая гипербола
    ctx.save(); ctx.beginPath(); ctx.rect(P.l, P.t, pw, ph); ctx.clip();
    ctx.beginPath();
    for (let i = 0; i <= 160; i++) {
      const f = F_MIN + (F_MAX - F_MIN) * i / 160;
      i ? ctx.lineTo(X(f), Y(thDeg(f))) : ctx.moveTo(X(f), Y(thDeg(f)));
    }
    ctx.strokeStyle = COLOR.fg; ctx.lineWidth = 2; ctx.stroke();

    // Текущая точка с проекциями на оси
    const px = X(S.f), py = Math.max(P.t, Y(thDeg(S.f)));
    ctx.setLineDash([3, 4]); ctx.strokeStyle = COLOR.accent; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px, P.t + ph); ctx.lineTo(px, py); ctx.lineTo(P.l, py); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = COLOR.accent; ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Подпись точки
    const label = `${fmt(S.f, 1)} ГГц · θ = ${fmt(thDeg(S.f), 2)}°`;
    ctx.font = `500 12px ${FONT_MONO}`;
    const tw = ctx.measureText(label).width + 14;
    let lx = px + 12, ly = py - 30;
    if (lx + tw > P.l + pw) lx = px - 12 - tw;
    if (lx < P.l + 4) lx = P.l + 4;
    if (ly < P.t + 4) ly = py + 12;
    ctx.fillStyle = COLOR.accent; ctx.fillRect(lx, ly, tw, 22);
    ctx.fillStyle = COLOR.bg; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(label, lx + 7, ly + 11.5);

    ctx.strokeStyle = COLOR.line; ctx.lineWidth = 1; ctx.strokeRect(P.l + 0.5, P.t + 0.5, pw - 1, ph - 1);
  }

  /** Выбор частоты нажатием на график. */
  function graphPointer(e) {
    if (!graphGeom) return;
    const r = $('graph').getBoundingClientRect();
    const u = Math.min(1, Math.max(0, (e.clientX - r.left - graphGeom.l) / graphGeom.pw));
    userSet({ f: Math.round((F_MIN + u * (F_MAX - F_MIN)) * 10) / 10 });
  }

  /* =====================================================================
     7. ТЕКСТЫ И ЧИСЛА НА СТРАНИЦЕ
     ===================================================================== */

  let captionFn = () => t('capDefault'), captionActive = false;
  function setCaption(fn, active) {
    captionFn = fn; captionActive = !!active;
    const c = $('caption'); c.textContent = fn(); c.classList.toggle('active', captionActive);
  }

  /** Заполнение ползунка жёлтым до текущего значения. */
  function fillRange(el) { el.style.setProperty('--p', ((el.value - el.min) / (el.max - el.min) * 100) + '%'); }

  function updateTexts() {
    const lam = lambdaOf(S.f), th = thetaOf(S.f, S.D), thDeg = rad2deg(th);

    $('inF').value = S.f; $('inD').value = S.D; $('inSep').value = S.sep;
    ['inF', 'inD', 'inSep'].forEach(id => fillRange($(id)));
    $('outF').textContent = `${fmt(S.f, 1)} ГГц`;
    $('outD').textContent = `${fmt(S.D, 2)} м`;
    $('outSep').textContent = `${fmt(S.sep, 2)}°`;

    $('valLam').textContent = `${fmt(lam * 100, lam < 0.1 ? 2 : 1)} см`;
    $('valTheta').innerHTML = `${fmt(thDeg, 2)}°<small>${fmt(th, 4)} рад</small>`;
    $('warnAngle').hidden = thDeg <= 30;

    const st = stateOf(S.sep, thDeg);
    $('verdict').dataset.state = st;
    $('verdictTitle').textContent = t('vd_' + st);
    $('verdictSub').textContent = t('vs_' + st);
    $('schemeNote').textContent = t('sn_' + st);

    // Пошаговый расчёт — те же четыре шага, что в ходе решения задания
    $('calcSteps').innerHTML = [
      `f = ${fmt(S.f, 1)} ГГц = ${sci(S.f * 1e9, 1)} Гц`,
      `λ = c / f = (3,00 × 10⁸) / (${sci(S.f * 1e9, 1)}) = ${fmt(lam, 4)} м = ${fmt(lam * 100, 2)} см`,
      `θ ≈ 1,22 × ${fmt(lam, 4)} / ${fmt(S.D, 2)} = ${fmt(th, 4)} рад`,
      `θ = ${fmt(th, 4)} × 180° / π ≈ ${fmt(thDeg, 2)}°`
    ].map(s => `<li>${s}</li>`).join('');
  }

  /** Полная перерисовка эксперимента. Несколько вызовов подряд сливаются в один кадр. */
  let renderQueued = false;
  function render() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => { renderQueued = false; updateTexts(); drawSky(); drawScheme(); drawGraph(); });
  }

  /** Пример из жизни: лучи на 3 и 12 ГГц и ряд спутников через 3° (учебные значения). */
  function buildBeams() {
    const card = g => {
      const th = thetaOf(g, 0.8), r = 220, rs = 238, x = r * Math.cos(th), y = r * Math.sin(th);
      let sats = '', inside = 0;
      for (let a = -9; a <= 9; a += 3) {
        const hit = Math.abs(deg2rad(a)) < th; if (hit) inside++;
        sats += `<circle cx="${(rs * Math.cos(deg2rad(a))).toFixed(1)}" cy="${(rs * Math.sin(deg2rad(a))).toFixed(1)}" r="3.4" fill="${hit ? COLOR.accent : COLOR.dim}"/>`;
      }
      return `<div class="frame beam"><svg viewBox="-12 -46 266 92" role="img" aria-label="${g} ГГц">
        <path d="M0 0 L${x.toFixed(1)} ${(-y).toFixed(1)} A${r} ${r} 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)} Z" fill="${COLOR.accent}" fill-opacity=".18" stroke="${COLOR.accent}" stroke-width="1"/>
        <path d="M-6 -12 Q2 0 -6 12" fill="none" stroke="${COLOR.fg}" stroke-width="2.4" stroke-linecap="round"/>${sats}</svg>
        <p>${t('beamCap')(g, fmt(rad2deg(th), 1), inside)}</p></div>`;
    };
    $('beams').innerHTML = card(3) + card(12);
  }

  /** Смена языка: подставляет все тексты и перерисовывает подписи на холстах. */
  function applyLang(l) {
    lang = l;
    try { localStorage.setItem('antenna_lang', l); } catch (e) {}
    document.documentElement.lang = l;
    $('lang-kk').setAttribute('aria-pressed', l === 'kk'); $('lang-ru').setAttribute('aria-pressed', l === 'ru');
    document.querySelectorAll('[data-i]').forEach(el => { el.textContent = t(el.dataset.i); });
    document.querySelectorAll('[data-h]').forEach(el => { el.innerHTML = t(el.dataset.h); });   // тексты с разметкой формул
    buildBeams(); setCaption(captionFn, captionActive);
    updateTexts(); drawSky(); drawScheme(); drawGraph(); drawHero(heroTime);
  }
  $('lang-kk').addEventListener('click', () => applyLang('kk'));
  $('lang-ru').addEventListener('click', () => applyLang('ru'));

  /* =====================================================================
     8. УПРАВЛЕНИЕ: ползунки, сброс, пример
     ===================================================================== */

  let demoToken = 0;                         // любое действие пользователя останавливает демонстрацию
  const cancelDemo = () => { demoToken++; };

  /** Изменение параметров пользователем. */
  function userSet(patch) { cancelDemo(); Object.assign(S, patch); render(); }

  $('inF').addEventListener('input', e => userSet({ f: +e.target.value }));
  $('inD').addEventListener('input', e => userSet({ D: +e.target.value }));
  $('inSep').addEventListener('input', e => userSet({ sep: +e.target.value }));

  const graph = $('graph');
  graph.addEventListener('pointerdown', e => { try { graph.setPointerCapture(e.pointerId); } catch (err) {} graphPointer(e); });
  graph.addEventListener('pointermove', e => { if (graph.hasPointerCapture(e.pointerId) && (e.buttons || e.pointerType === 'touch')) graphPointer(e); });

  function scrollToLab() { $('caption').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' }); }

  /** «Сбросить эксперимент»: возвращает значения из задания. */
  function resetExperiment() {
    cancelDemo(); Object.assign(S, DEFAULTS);
    setCaption(() => t('capDefault'), false); render();
  }

  /** Плавное изменение одного параметра; прерывается, если пользователь что-то тронул. */
  function tween(from, to, ms, apply, token) {
    return new Promise(resolve => {
      if (reducedMotion) { apply(to); return resolve(); }
      const t0 = performance.now();
      const tick = now => {
        if (token !== demoToken) return resolve();
        const u = Math.min(1, (now - t0) / ms), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;   // плавный разгон и торможение
        apply(from + (to - from) * e);
        u < 1 ? requestAnimationFrame(tick) : resolve();
      };
      requestAnimationFrame(tick);
    });
  }
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /** «Показать пример»: частота растёт 1 → 3 → 6 ГГц, два объекта на глазах разделяются. */
  async function runDemo() {
    const token = ++demoToken, alive = () => token === demoToken;
    const setF = f => { S.f = f; render(); };
    const th = f => fmt(rad2deg(thetaOf(f, DEFAULTS.D)), 2);

    Object.assign(S, DEFAULTS, { f: 1 }); render(); scrollToLab();
    setCaption(() => t('cap_d1'), true);
    await sleep(3200); if (!alive()) return;

    await tween(1, 3, 2600, setF, token); if (!alive()) return;
    setF(3); setCaption(() => t('cap_d3')(th(3)), true);
    await sleep(3600); if (!alive()) return;

    await tween(3, 6, 2600, setF, token); if (!alive()) return;
    setF(6); setCaption(() => t('cap_d6')(th(6)), true);
    await sleep(3600); if (!alive()) return;

    await tween(6, 3, 1800, setF, token); if (!alive()) return;
    setF(3); setCaption(() => t('cap_dEnd'), true);
  }

  document.querySelectorAll('[data-action="reset"]').forEach(b => b.addEventListener('click', () => { resetExperiment(); if (b.dataset.scroll) scrollToLab(); }));
  document.querySelectorAll('[data-action="demo"]').forEach(b => b.addEventListener('click', runDemo));

  // Пример из жизни: спутниковая антенна 0,8 м на 12 ГГц, соседние спутники через 3°
  $('btnSatellite').addEventListener('click', () => {
    cancelDemo(); Object.assign(S, DEFAULTS, { f: 12, sep: 3 });
    setCaption(() => t('cap_sat')(fmt(rad2deg(thetaOf(12, 0.8)), 2)), true);
    render(); scrollToLab();
  });

  /* =====================================================================
     9. АНИМАЦИИ: главный экран и волновые фронты на схеме
     ===================================================================== */

  const renderHero = makeAiryRenderer(180);
  let heroTime = 0;

  /** Главный экран: два пятна, расстояние между ними медленно проходит через предел. */
  function drawHero(sec) {
    heroTime = sec;
    const g = fit($('heroCanvas')); if (!g) return;
    const ratio = reducedMotion ? 1 : 1.15 + 0.75 * Math.sin(sec * 2 * Math.PI / 11 - 0.2);
    renderHero(g.ctx, g.w, g.h, 2.7, ratio, 1);
    $('heroRatio').textContent = fmt(ratio, 2);
    $('heroState').textContent = t('hs_' + stateOf(ratio, 1));
  }

  // Анимации идут, только пока соответствующий экран виден
  const visible = { heroCanvas: true, scheme: false };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { for (const en of es) visible[en.target.id] = en.isIntersecting; });
    io.observe($('heroCanvas')); io.observe($('scheme'));
  } else visible.scheme = true;

  let lastT = 0;
  function loop(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    if (visible.heroCanvas) drawHero(now / 1000);
    if (visible.scheme) { wavePhase += dt * 20; drawScheme(); }   // фронты бегут со скоростью 20 px/с
    requestAnimationFrame(loop);
  }

  /* =====================================================================
     10. ЗАПУСК
     ===================================================================== */

  applyLang(lang);
  if (!reducedMotion) requestAnimationFrame(now => { lastT = now; loop(now); });

  // Перерисовка при изменении размеров и после загрузки шрифтов
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => { render(); if (reducedMotion) drawHero(0); });
    ['sky', 'scheme', 'graph', 'heroCanvas'].forEach(id => ro.observe($(id)));
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
})();
