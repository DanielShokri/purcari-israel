import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// The refined product list mapped to categories
const PRODUCTS_DATA = [
  {
    "productName": "PINOT GRIGIO DE PURCARI NOCTURNE",
    "price": 100.0,
    "sku": "PRC-PINOTGRIGI",
    "wineType": "White",
    "descriptionHe": "יין לבן ייחודי המגיע ממחוז סטפן וודה במולדובה, מבית יקב PURCARI ההיסטורי.\nיין זה מתאפיין בארומה רעננה ומפתה, עם ניחוחות של תפוחים ירוקים ואגסים, יחד עם נגיעות קלות של פרחים לבנים. הטעמים הפירותיים והמעוררים שלו יוצרים חוויה נעימה ומרעננת, כאשר הסיומת שלו נשארת בהרמוניה על החיך.\nהייחודיות של סדרת Nocturne ניכרת בתהליך הבציר הלילי, שבו הענבים נבצרים בטמפרטורות נמוכות. תהליך זה מסייע בשמירה על הרעננות והארומה הטבעית של הענבים, ובכך מבטיח איכות גבוהה. ההפקה מתבצעת בקפידה רבה בכל שלב, תוך שמירה על טריות ואיזון של היין.\nפינו גריג’יו של Nocturne מתאים במיוחד למנות קלות כמו סלטים רעננים ופסטות עם רוטב קל. מומלץ לשתות אותו בטמפרטורה של 10-12 מעלות כדי ליהנות מכל הרבדים והניואנסים שלו.\nהיין מציע חוויית שתייה משובחת, עם טעמים עדינים המפתיעים את החיך ויוצרים סיומת ארוכה ומענגת. מדובר ביין המשלב טכנולוגיה מתקדמת עם הקפדה על כל פרט בתהליך הייצור, מה שמבטיח חוויית שתייה ייחודית.",
    "salePrice": null,
    "onSale": false,
    "vintage": 2023,
    "volume": "750 מ\"ל",
    "grapeVariety": "100% פינו גריגו",
    "servingTemperature": "10-12°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2024/10/x_-E7DJwTgaUZpm1uhV86g_pb_x600.png"
  },
  {
    "productName": "PASTORAL DE PURCARI",
    "price": 64.0,
    "sku": "PRC-PASTORALDE",
    "wineType": "Red",
    "descriptionHe": "נלהב ומרגש, תופס במערבולת הקטיפתית שלו ומפתה אותך בפרץ של טעמים עזים.\nלצבע האודם העז טעם מורכב של פירות מסוכרים, עם ניואנסים של שזיף וקקאו. יין בעל טעם מלא, נשלט על ידי תווים של פירות שחורים בשלים במיוחד ושוקולד, המודגשים על ידי טעם לוואי ממושך, עם תווים של הבשלה.\nעשוי מענבים שנבצרו ונבחרו בעבודת יד, המיוצרים בשיטות מסורתיות. התיישן 12 חודשים בעץ אלון צרפתי.",
    "salePrice": null,
    "onSale": false,
    "vintage": 2020,
    "volume": "750 מ\"ל",
    "grapeVariety": "100% קברנה סוביניון",
    "servingTemperature": "18 – 20°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2023/01/pastoral-de-purcari.webp"
  },
  {
    "productName": "MERLOT DE PURCARI",
    "price": 100.0,
    "sku": "PRC-MERLOTDEPU",
    "wineType": "Red",
    "descriptionHe": "MERLOT DE PURCARI\nיין אדום יבש\nשנת 2019\nמרלו דה פורקרי – צבע האדום דומה לקטיפה ומאופיין בטעמים עדינים של פירות אדומים.\nטעם קטיפתי עם עפיצות נעימה וגווני אלון, תות וורדים המבליטים את טעם הלוואי העמיד לאורך זמן.\nמיוצר מענבים שנקטפו ונבחרו בעבודת יד, המיוצרים בשיטות מסורתיות.\nהתיישן במשך 6 חודשים בחבית עץ אלון צרפתי.\nהולך מעולה עם:\nמנות בקר\nמורכב מ-100% מרלו\nטמפרטורת הגשה מומלצת: +18 … +20 ° С.",
    "salePrice": null,
    "onSale": false,
    "vintage": 2019,
    "volume": "750 מ\"ל",
    "grapeVariety": "100% מרלו",
    "servingTemperature": "18 – 20°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2021/09/MERLOT-DE-PURCARI-1.png"
  },
  {
    "productName": "MALBEC DE PURCARI",
    "price": 84.9,
    "sku": "PRC-MALBECDEPU",
    "wineType": "Red",
    "descriptionHe": "מלבק דה פורקרי הוא יין איכותי בעל טעמים דומיננטיים – כאלה שיפתיעו אותך.\nהצבע האדום מלווה בגוונים עדינים של אוכמניות, דומדמניות שחורות וסיגליות.\nהטעם מתוחכם, המרקם קטיפתי שישאיר לכם טעם של עוד.\nהיין התיישן במשך 12 חודשים בחבית עץ אלון צרפתי.",
    "salePrice": null,
    "onSale": false,
    "vintage": 2018,
    "volume": "750 מ\"ל",
    "grapeVariety": "100% מלבק",
    "servingTemperature": "16 – 18°, 18 – 20°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2020/12/malbec.png"
  },
  {
    "productName": "ICE WINE PURCARI",
    "price": 159.9,
    "sku": "PRC-ICEWINEPUR",
    "wineType": "Red",
    "descriptionHe": "אייס יין PURCARI\nיין לבן מתוק\nשנת 2017\nPurcari Icewine – דואט ודו קרב בין אש לקרח, חוויה מורכבת, יין מרגש ומאתגר.\nצבעו החגיגי של היין הוא זהב בהיר עם טעמים מורכבים ותווים של דבש ופירות מתוקים כמו מנגו, אפרסק ופאפאיה המתפתחים עם הזמן, וחושפים טעמים משובחים של תבלינים ופירות אקזוטיים. טעם הלוואי המתוק מתמשך להפליא, ומעניק ליין את העידון הדרוש.\nמיוצר מענבים מוסקט-אוטונל וטראמינר, שנקטפו ב -6 …- 8 ℃.\nנבחרים ונקטפים בעבודת יד ובכפפות בשיטות מסורתיות על מנת לא לחמם את הענבים הקפואים.\nהולך מעולה עם:\nקינוחים ופירות אקזוטיים.\n-היין מגיע באריזה חגיגית ומכובדת ויכול לשמש כמתנה שתסב הרבה הנאה לכולם.\nטמפרטורת הגשה מומלצת: +10 ℃.",
    "salePrice": null,
    "onSale": false,
    "vintage": 2017,
    "volume": "375 מ\"ל",
    "grapeVariety": "מוסקט-אוטונל וטראמינר",
    "servingTemperature": "10-12°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2021/09/ICE-WINE-PURCARI.png"
  },
  {
    "productName": "FREEDOM BLEND",
    "price": 84.9,
    "sku": "PRC-FREEDOMBLE",
    "wineType": "Red",
    "descriptionHe": "FREEDOM BLEND\nיין אדום יבש\nשנת 2019\nביטוי הרוח החופשית, תערובת אמיצה, מלאת אופי, משלושה זני ענבים מקומיים. יש בה את ליבה של גיאורגיה, המסורת של מולדובה, ואת הרוח החופשית של אוקראינה.\nצבע האודם העז וגווני השקדים מייצרים זר מורכב הנשלט על ידי דובדבנים, אוכמניות ודומדמניות, בתוספת שזיפים מיובשים. הטעם המלא והפירותי לוכד את האלגנטיות והעידון, ומעניק טעם לוואי קטיפתי.\nהיין התיישן במשך 12 חודשים בחבית עץ אלון צרפתי.\nמורכב מ-65% ספראבי, 20% רררה נגרה, 15% באסטרדו.\nהולך מעולה עם:\nבשר בקר או מתאבני גבינה מותססים וקינוחים עם שוקולד מריר.\nטמפרטורת הגשה מומלצת: +18 … +20 ° С.",
    "salePrice": null,
    "onSale": false,
    "vintage": 2019,
    "volume": "750 מ\"ל",
    "grapeVariety": "65% ספראבי, 20% רארה נגרא, 15% באסטרדו",
    "servingTemperature": "18 – 20°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2021/09/FREEDOM-BLEND.png"
  },
  {
    "productName": "Feteasca Neagra",
    "price": 84.9,
    "sku": "PRC-FETEASCANE",
    "wineType": "Red",
    "descriptionHe": "Feteasca Neagra הוא יין מפתיע באיזון הטעמים החמים שלו.\n\nצבע אודם עז עם גוונים סגולים, בעל מרקם קטיפתי וניחוחות של דומדמניות שחורות ושזיפים\n\nמיובשים. טעם של פטל שחור ותותים המתובלים בקינמון.\nהיין התיישן במשך 12 חודשים בחבית עץ אלון צרפתי.",
    "salePrice": null,
    "onSale": false,
    "vintage": 2019,
    "volume": "750 מ\"ל",
    "grapeVariety": "100% Feteasca Neagra",
    "servingTemperature": "",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2021/12/מעודכןן.png"
  },
  {
    "productName": "CUVÉE DE PURCARI, EXTRA BRUT WHITE",
    "price": 100.0,
    "sku": "PRC-CUVEDEPURC",
    "wineType": "Sparkling",
    "descriptionHe": "CUVÉE DE PURCARI, EXTRA BRUT WHITE הוא בחירה מושלמת לבלות את הרגעים הקסומים של החיים עם יקיריכם, בשילוב עם ניחוחות הדרים פירותיים והטעם רענן.\nההבשלה לטווח הארוך בבקבוקים מציעה יין מבעבע רך ומושלם.\nטקסטורה טרייה של הדרים ופירות.",
    "salePrice": null,
    "onSale": false,
    "vintage": 2017,
    "volume": "750 מ\"ל",
    "grapeVariety": "60% שרדונה 25% פינו בלאן 15% פינו נואר",
    "servingTemperature": "5°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2020/12/Extra-Brut.png"
  },
  {
    "productName": "CUVEE DE PURCARI BRUT WHITE WINE",
    "price": 115.9,
    "sku": "PRC-CUVEEDEPUR",
    "wineType": "Sparkling",
    "descriptionHe": "הטעמים המשובחים מתמזגים בתערובת יוצאת דופן של זני שרדונה, פינו בלאן ופינו נואר.\nההתבגרות ארוכת הטווח בבקבוקים מציעה פנינה רכה ומתמשכת.\nהגוון הזהוב של היין המבעבע מואצל בטעם הדרים וטעם מורכב עם ניואנסים של אפרסק.",
    "salePrice": null,
    "onSale": false,
    "vintage": null,
    "volume": "750 מ\"ל",
    "grapeVariety": "60% שרדונה 25% פינו בלאן 15% פינו נואר",
    "servingTemperature": "10-12°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2021/12/מעודכן.png"
  },
  {
    "productName": "CUVÉE DE PURCARI BRUT ROSÉ",
    "price": 115.9,
    "sku": "PRC-CUVEDEPURC",
    "wineType": "Sparkling",
    "descriptionHe": "תערובת יוצאת דופן של הזנים שרדונה ופינו נואר.\nהגוון הוורד מעורר אלגנטיות בעל טעם עדין של דומדמניות.",
    "salePrice": null,
    "onSale": false,
    "vintage": 2018,
    "volume": "750 מ\"ל",
    "grapeVariety": "70% פינו נואר 30% שרדונה",
    "servingTemperature": "5°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2020/12/Rose-Brut.png"
  },
  {
    "productName": "CHARDONNAY DE PURCARI NOCTURNE",
    "price": 100.0,
    "sku": "PRC-CHARDONNAY",
    "wineType": "White",
    "descriptionHe": "יין לבן אלגנטי ומאוזן המגיע ממחוז סטפן וודה במולדובה, מבית יקב PURCARI ההיסטורי שהוקם בשנת 1827.\nהשרדונה מתאפיין בצבע זהוב בהיר ובניחוחות עשירים של פירות טרופיים ואגסים, יחד עם נגיעות עדינות של חמאה ווניל. הוא בעל ארומה אינטנסיבית, עם דומיננטיות של פרחים טרופיים ופירות אקזוטיים.\nהייחודיות של סדרת Nocturne ניכרת בתהליך הבציר הלילי, שבו הענבים נבצרים בטמפרטורות נמוכות, דבר השומר על טריותם והארומה הטבעית.\nהשרדונה מתאים במיוחד למנות כמו עוף בגריל, דגים צלויים ופסטות ברוטב שמנת. מומלץ לשתות אותו בטמפרטורה של 10-12 מעלות כדי לגלות את העומק והתחכום של Purcari.\nעם טעם מלא ועשיר, המשלב נגיעות של שקדים ווניל, השרדונה מציע סיומת ארוכה ונעימה. מדובר ביין המשלב טכנולוגיה מתקדמת עם תשומת לב לכל פרט בתהליך הייצור, מה שמבטיח חוויית שתייה ייחודית.",
    "salePrice": null,
    "onSale": false,
    "vintage": null,
    "volume": "750 מ\"ל",
    "grapeVariety": "100% שרדונה",
    "servingTemperature": "10-12°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2024/10/Nvqwa1ByR2KMN8MI-Ii7bg_pb_x600.png"
  },
  {
    "productName": "CABERNET SAUVIGNON DE PURCARI NOCTURNE",
    "price": 100.0,
    "sku": "PRC-CABERNETSA",
    "wineType": "Red",
    "descriptionHe": "יין אדום עוצמתי ויוקרתי המגיע ממחוז סטפן וודה במולדובה, מבית יקב PURCARI ההיסטורי שהוקם בשנת 1827.\nהיין מציע צבע רובי עמוק עם רפלקציות סגולות, וארומה עשירה של דובדבנים שחורים, שוקולד, צימוקים וניל. הייחודיות של סדרת Nocturne טמונה בתהליך החדשני שבו הענבים נבצרים אך ורק בלילה, כאשר הטמפרטורות נמוכות. שיטה זו עוזרת לשמר את הארומות הטבעיות של הענבים, התורמות לעומק ולמורכבות הטעמים של היין.\nלאחר הבציר, הקברנה סוביניון מיושן במשך 12 חודשים בחביות עץ אלון צרפתי, אשר מעניקות ליין מרקם חלק ואלגנטי, עם נגיעות עדינות של עץ, שוקולד ווניל. חביות אלו תורמות גם לעמקי הטעמים, ומוסיפות גוון מורכב ומסוגנן לסיומת היין. הטנינים בולטים, אך מאוזנים, והם מדגישים את העגלגלות והרכות של היין, עם סיומת ארוכה ומרשימה.\nהקברנה סוביניון הזה מתאים במיוחד לליווי ארוחות בשר עשירות כגון ריביי, פילה מיניון, טלה וברווז. הוא מושלם לאירועים מיוחדים או לרגעים שקטים של הנאה בבית. מומלץ לשתות אותו בטמפרטורה של 18-20 מעלות כדי לגלות את העומק והייחוד של PURCARI.",
    "salePrice": null,
    "onSale": false,
    "vintage": 2023,
    "volume": "750 מ\"ל",
    "grapeVariety": "100% קברנה סוביניון",
    "servingTemperature": "18 – 20°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2024/10/qpb5N-ZFSXKLCnHkiZJOyA_pb_x600.png"
  },
  {
    "productName": "CHARDONNAY DE PURCARI",
    "price": 100.0,
    "sku": "PRC-CHARDONNAY",
    "wineType": "Red",
    "descriptionHe": "שרדוני דה פורקרי, מלך היינות הלבנים: מדהים, עם ריח חזק ודומיננטי.\nיש לו צבע זהוב, עם גווני ענבר.\nארומה חזקה של פרחים ופירות אקזוטיים.\nהטעם מלא ושופע, מורכב משקדים וטעמי ווניל.",
    "salePrice": null,
    "onSale": false,
    "vintage": null,
    "volume": "750 מ\"ל",
    "grapeVariety": "100% שרדונה",
    "servingTemperature": "10-12°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2020/12/chardonnay.png"
  },
  {
    "productName": "SAUVIGNON BLANC DE PURCARI",
    "price": 100.0,
    "sku": "PRC-SAUVIGNONB",
    "wineType": "Red",
    "descriptionHe": "סוביניון בלאן דה פורקרי יין לבן עדין ומרענן.\nצבע הזהב הבהיר בא לידי ביטוי בטעמו העשיר המורכב מהדרים, אשכוליות וליים אקזוטי.",
    "salePrice": null,
    "onSale": false,
    "vintage": null,
    "volume": "750 מ\"ל",
    "grapeVariety": "100% סוביניון בלאן",
    "servingTemperature": "10-12°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2020/12/sauvignon.png"
  },
  {
    "productName": "NEGRU DE PURCARI",
    "price": 100.0,
    "sku": "PRC-NEGRUDEPUR",
    "wineType": "Red",
    "descriptionHe": "נגרו דה פורקרי הוא מלך היינות האדומים!\nאצילי,עשיר וניחוח יין מושלם.\nהצבע האדום מלווה בטעמים של פירות מתוקים – שזיפים ותאנים בשלים\nיחד עם הטעמים המשובחים של הזעפרן.\nמיושן במשך 18 חודשים בחבית מעץ אלון צרפתי.",
    "salePrice": null,
    "onSale": false,
    "vintage": 2019,
    "volume": "750 מ\"ל",
    "grapeVariety": "70% קברנה סוביניון, 25% ספאראווי, 5% ררה נגרה",
    "servingTemperature": "18 – 20°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2020/12/Negru.png"
  },
  {
    "productName": "CABERNET-SAUVIGNON DE PURCARI",
    "price": 100.0,
    "sku": "PRC-CABERNETSA",
    "wineType": "Red",
    "descriptionHe": "קברנה סוביניון דה פורקרי הוא יין אדום בעל טעם עשיר וחזק .\nצבע אדום עז עם ארומה עשירה, הנשלט על ידי דובדבן שחור, בתוספת תבלינים משובחים.\nהטעם פירותי בעל נגיעות של פירות בשלים, שוקולד, וניל וצימוקים.\nמיוצר מענבים שנקטפו ונבחרו בעבודת יד, מיוצרים בשיטה המסורתית.\nמיושן במשך 12 חודשים בחבית מעץ אלון צרפתי.",
    "salePrice": null,
    "onSale": false,
    "vintage": 2019,
    "volume": "750 מ\"ל",
    "grapeVariety": "100% קברנה סוביניון",
    "servingTemperature": "18 – 20°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2020/12/cabernet.png"
  },
  {
    "productName": "VIORICA DE PURCARI NOCTURNE",
    "price": 100.0,
    "sku": "PRC-VIORICADEP",
    "wineType": "White",
    "descriptionHe": "Viorica Nocturne – יין לבן אלגנטי וייחודי המגיע ממחוז סטפן וודה במולדובה, מבית יקב PURCARI הוותיק שנוסד בשנת 1827.\nה-Viorica מתאפיין בצבע זהוב בהיר עם נגיעות ירקרקות, וניחוחות משכרים של פריחת הדרים, ליצ’י, אפרסק לבן ורמזים עדינים של עשבי תיבול רעננים. הארומה העשירה והאלגנטית מציעה חוויית שתייה מרעננת ויוצאת דופן.\nמה שמייחד את סדרת Nocturne הוא השימוש בטכנולוגיה חדשנית ובשיטת ייצור ייחודית, בה הענבים נבצרים אך ורק בשעות הלילה הקרירות. תהליך זה מסייע לשמר את הארומות הרעננות ואת החמיצות המאוזנת של היין, מה שמעניק לו עומק ומורכבות ייחודית.\nהיין חושף טעמים מאוזנים של פירות טרופיים, מלון ואשכולית, לצד מרקם רך וקטיפתי. הסיומת הארוכה מותירה תחושת רעננות מלטפת עם נגיעה מינרלית עדינה.\nה-Viorica Nocturne מתאים במיוחד למנות דגים, גבינות רכות ומנות ים-תיכוניות מעודנות. זהו יין שנועד לרגעים מיוחדים ולכאלה שמחפשים חוויית שתייה אלגנטית ומלאת אופי. מומלץ להגיש בטמפרטורה של 10-12 מעלות כדי ליהנות ממלוא העושר והאיזון של PURCARI.",
    "salePrice": null,
    "onSale": false,
    "vintage": null,
    "volume": "750 מ\"ל",
    "grapeVariety": "100% VIORICA",
    "servingTemperature": "10-12°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2025/02/0c9cd349-93b2-40a2-99aa-8d2406448b5f.png"
  },
  {
    "productName": "SAUVIGNON BLANC DE PURCARI NOCTURNE",
    "price": 100.0,
    "sku": "PRC-SAUVIGNONB",
    "wineType": "White",
    "descriptionHe": "יין לבן רענן ומלא חיים המגיע ממחוז סטפן וודה במולדובה, מבית יקב PURCARI שנוסד בשנת 1827.\nהסוביניון בלאן מתהדר בצבע זהוב עדין ומבריק, עם ניחוחות רעננים של הדרים, עשבי תיבול ירוקים וליים, המתובל במינרליות עדינה. הארומה המרעננת של היין מלאה בטעמים עשירים של פירות הדר ופירות אקזוטיים, עם ניחוחות פרחוניים המוסיפים לו מורכבות ונעימות.\nהייחודיות של סדרת Nocturne ניכרת בטכנולוגיה חדשנית ובתהליך הבציר הלילי, שבו הענבים נבצרים בטמפרטורות נמוכות, דבר השומר על הרעננות והעושר הארומטי של הענבים. התוצאה היא יין קליל ומרענן, עם טעמים מרוכזים ואיזון מושלם של חמיצות.\nהסוביניון בלאן הזה אידיאלי כליווי למנות דגים, סושי וסלטים ירוקים. מומלץ לשתות אותו בטמפרטורה של 10-12 מעלות כדי לגלות את הטריות המופלאה של PURCARI.",
    "salePrice": null,
    "onSale": false,
    "vintage": null,
    "volume": "750 מ\"ל",
    "grapeVariety": "100% סוביניון בלאנק",
    "servingTemperature": "10-12°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2024/10/ArIJ60zoSRKHIDz2L439Fg_pb_x600.png"
  },
  {
    "productName": "SAPERAVI DE PURCARI – Limited Edition",
    "price": 100.0,
    "sku": "PRC-SAPERAVIDE",
    "wineType": "Red",
    "descriptionHe": "Saperavi de Purcari Limited Edition הוא יין בעל אישיות חזקה שתפתיע אתכם – פיצוץ של חן וטעם, ותערובות הריח המפתיעות ביותר.\nSaperavi, הזן הגיאורגי הריחני המפורסם ללא ספק, ידוע באופי החזק שלו ובאותנטיות של הטעם השופע. היין בצבע אודם עז עם השתקפויות סגולות עם ניחוחות של שזיף ופירות בשלים היטב.\nהטעם המלא והשופע, מתפתח לטעם לוואי ארוך ונעים, עם ניחוחות מורכבים.",
    "salePrice": null,
    "onSale": false,
    "vintage": null,
    "volume": "750 מ\"ל",
    "grapeVariety": "100% סאפראבי",
    "servingTemperature": "18 – 20°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2023/01/SAPERAVI-DE-PURCARI.webp"
  },
  {
    "productName": "ROȘU DE PURCARI",
    "price": 100.0,
    "sku": "PRC-ROUDEPURCA",
    "wineType": "Red",
    "descriptionHe": "ROSU DE PURCARI \nיין אדום יבש\nשנת 2017\nRosu de Purcari הוא בשל, עשיר ומלא טעם ההופכים אותו לתגלית המרהיבה עבור אוהבי היין.\nצבעו אדום כמו אש, נלהב ותשוקתי כמו האהבה הראשונה.\nהניחוח מורכב מפירות יער, חמוציות ושזיפים מיובשים החושפים ניואנסים מתוקים ועדינים של וניל. טעם הפרי מפתיע בזכות העידון, העומק והטעם החלק.\nמיוצר מענבים שנקטפו ונבחרו בעבודת יד ע”י שיטות מסורתיות.\nהיין התיישן במשך 18 חודשים בחבית עץ אלון צרפתי.\nמורכב מ-50% קברנה-סוביניון, 40% מרלו, 10% מלבק\nהולך מעולה עם:\nגבינות קשות כמו פרמז’ן וצ’דר או לצד סטייק, אסאדו ופרגיות.\nמומלץ לתת ליין לנשום (עדיף בדקנטר) למשך 30 דקות לפני ההגשה.\nטמפרטורת הגשה מומלצת: +18 … +20 ° С.",
    "salePrice": null,
    "onSale": false,
    "vintage": 2019,
    "volume": "750 מ\"ל",
    "grapeVariety": "50% קברנה-סוביניון, 40% מרלו, 10% מלבק",
    "servingTemperature": "18 – 20°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2021/09/ROSU-DE-PURCARI.png"
  },
  {
    "productName": "ROSE DE PURCARI NOCTURNE",
    "price": 100.0,
    "sku": "PRC-ROSEDEPURC",
    "wineType": "Rosé",
    "descriptionHe": "יין רוזה ייחודי המגיע ממחוז סטפן וודה במולדובה, מבית יקב Purcari ההיסטורי שהוקם בשנת 1827.\nיין זה מתאפיין בצבע ורוד בהיר ועדין, עם ניחוחות מפתים של פירות אדומים טריים כמו תותים ודובדבנים, יחד עם נגיעות פרחוניות אלגנטיות. הייחודיות של סדרת Nocturne ניכרת בתהליך הבציר הלילי, שבו הענבים נבצרים בטמפרטורות נמוכות, דבר שמסייע בשמירה על רעננותם ואופיים הטבעי.\nבאמצעות טכנולוגיה חדשנית, היין מבטיח טריות ואיזון מושלמים לאורך כל הדרך. הוא מתאים במיוחד למנות קלות כגון דגים וסלטים רעננים. מומלץ לשתות אותו בטמפרטורה של 10-12 מעלות כדי לגלות את רעננותו והאלגנטיות שלו.\nRosé Nocturne de Purcari הוא בלנד המיוצר מענבי קברנה סוביניון, מרלו וררה נגרה, ובעל טעם עדין עם נגיעות של משמש, אפרסק וקרנט, שמתרקמות עם טעמים ארוכים של פירות יער. מדובר ביין המשלב מסורת ייצור עם טכנולוגיה מתקדמת.",
    "salePrice": null,
    "onSale": false,
    "vintage": null,
    "volume": "750 מ\"ל",
    "grapeVariety": "40% מרלו, 5% ררה נגרה, 55% קברנה סוביניון",
    "servingTemperature": "10-12°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2024/10/a6m3uXjLR5OJ_wsxfxoQmQ_pb_x600.png"
  },
  {
    "productName": "RARA NEAGRĂ SAPERAVI DE PURCARI",
    "price": 100.0,
    "sku": "PRC-RARANEAGRS",
    "wineType": "Red",
    "descriptionHe": "גלו את היין המדהים של פורקרי – רארה נגרה וספרבי, בלנד הרמוני של שני זני ענבים אייקוניים. יין אדום מלא גוף זה מציע ניחוחות עשירים של פירות יער כהים, שזיפים ותבלינים, עם טעמים עמוקים ומורכבים, המלוות בטאנינים רכים וסיום ארוך ומרשים. אידיאלי כתוספת למנות עשירות או לשתייה בפני עצמו, מדובר ביין שמגלם את אומנות הייצור והמסורת בצורה מושלמת.",
    "salePrice": null,
    "onSale": false,
    "vintage": 2019,
    "volume": "750 מ\"ל",
    "grapeVariety": "100% ררה נגרה",
    "servingTemperature": "18 – 20°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2020/12/purcari-rara-neagra-saperavi-2023-s.webp"
  },
  {
    "productName": "RARA NEAGRA DE PURCARI NOCTURNE",
    "price": 100.0,
    "sku": "PRC-RARANEAGRA",
    "wineType": "Red",
    "descriptionHe": "יין אדום אלגנטי וייחודי המגיע ממחוז סטפן וודה במולדובה, מבית יקב PURCARI הוותיק שנוסד בשנת 1827.\nה-Rara Neagra מתאפיין בצבע ארגמן עמוק וצלול, עם ניחוחות משכרים של פירות יער בשלים, שזיפים, עץ אלון ונגיעות עדינות של תבלינים מתוקים. הארומה העשירה והמרתקת מציעה חוויית שתייה ייחודית.\nמה שמייחד את סדרת Nocturne הוא השימוש בטכנולוגיה חדשנית ובשיטת ייצור ייחודית בה הענבים נבצרים אך ורק בלילה, כשהטמפרטורות נמוכות יותר. תהליך זה עוזר לשמר את הארומות והטריות של הפרי, דבר המעניק ליין עומק ומורכבות.\nלאחר הבציר, היין עובר יישון במשך 12 חודשים בחביות עץ אלון צרפתי, שמוסיפות לו מורכבות ועומק בטעמים. הצבע הרובי המלא חושף את הטעמים הפירותיים של דובדבנים וקרנבריז, עם נגיעה קלה של פלפל. המרקם הסאטן מדגיש את הטנינים הבינוניים והעדינים, שמוסיפים לו עגלגלות ורכות.\nה-Rara Neagra מתאים במיוחד לצד מאכלים כמו סטייקים עסיסיים, מנות עוף צלוי ומנות פסטה עשירות ברוטב. זהו יין שנועד לרגעים מיוחדים ולכאלה שמתחשק בהם ליהנות מקסם יין ייחודי. מומלץ לשתות אותו בטמפרטורה של 18-20 מעלות כדי לגלות את העולם העשיר של PURCARI.",
    "salePrice": null,
    "onSale": false,
    "vintage": null,
    "volume": "750 מ\"ל",
    "grapeVariety": "100% ררה נגרה",
    "servingTemperature": "18 – 20°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2024/10/MYs-g0FsSjaZuvUd7TvIxQ_pb_x600.png"
  },
  {
    "productName": "PINOT NOIR DE PURCARI",
    "price": 100.0,
    "sku": "PRC-PINOTNOIRD",
    "wineType": "Red",
    "descriptionHe": "פינו נואר דה פורקרי הוא יין קליל ועדין כמו משי משובח.\nהצבע האדום – סגול מלווה בזר מגוון עם ניחוחות מורכבים של תותים, פטל וסיגליות. טעם קטיפתי, מלא, מתמשך, עובר בטעם לוואי עם ניואנסים עדינים של התבגרות.\nמיוצר מענבים שנקטפו ונבחרו ביד, ומיוצרים בשיטות מסורתיות. התיישן במשך 6 חודשים בברק עץ אלון צרפתי.\nהולך מעולה עם:\nגבינות, בשר, פטריות ואספרגוס.",
    "salePrice": null,
    "onSale": false,
    "vintage": null,
    "volume": "750 מ\"ל",
    "grapeVariety": "100% פינו נואר",
    "servingTemperature": "18 – 20°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2020/12/Red-Pinot-Noir-w-cup-17-copy.png"
  },
  {
    "productName": "VINOHORA FETEASCĂ ALBĂ & CHARDONNAY",
    "price": 64.0,
    "sku": "PRC-VINOHORAFE",
    "wineType": "White",
    "descriptionHe": "VINOHORA FETEASCĂ ALBĂ & CHARDONNAY \nיין לבן יבש\nשנת 2018\nאוסף וינוחורה – מהדורה מוגבלת של יינות Purcari, פוגש את הזנים המקומיים של מולדובה וזנים קלאסיים בינלאומיים.\nתערובת היין הלבן היא ריקוד מולדובי-צרפתי (“הורה”) המשלב אותנטיות ואלגנטיות של פיטאסקה אלבה עם העוצמה והשפע של שרדונה הקלאסי.\nהטעם מורכב מתווים טריים של פרחי ליים, אגס ואניס, החושף בהדרגה את טעמו העדין של יסמין, פרלין וקוקוס.\nמורכב מ-51% פיטאסקה אלבה, 49% שרדונה.\nהולך מעולה עם:\nדגים וקינוחים קלים.\nטמפרטורת הגשה מומלצת: +10 … +12 ° С.",
    "salePrice": 60.0,
    "onSale": true,
    "vintage": 2019,
    "volume": "750 מ\"ל",
    "grapeVariety": "51% פטיסקה אלבה, 49% שרדונה",
    "servingTemperature": "10-12°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2021/09/VINOHORA-FETEASCA-ALBA-CHARDONNAY-2018.png"
  },
  {
    "productName": "TRAMINER DE PURCARI",
    "price": 64.0,
    "sku": "PRC-TRAMINERDE",
    "wineType": "White",
    "descriptionHe": "טראמינר דה פורקרי יין קליל, רענן וקל לזכור אותו\nTraminer de Purcari הוא יין לבן העשוי מענב אצילי של טרימנר.\nהיין מאופיין בטעמו הייחודי, הפירותי והרך במיוחד עם נגיעות עדינות של יסמין.",
    "salePrice": 60.0,
    "onSale": true,
    "vintage": 2019,
    "volume": "750 מ\"ל",
    "grapeVariety": "100% טרמינר",
    "servingTemperature": "10-12°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2020/12/traminer.png"
  },
  {
    "productName": "ROSÉ DE PURCARI",
    "price": 64.0,
    "sku": "PRC-ROSDEPURCA",
    "wineType": "Rosé",
    "descriptionHe": "רוזה דה פרקרי מלווה בטעם פירותי עדין עם נגיעות של משמש, אפרסק ודומדמניות שחורות.\nהצבע הוורוד מלווה בארומה עדינה של פירות אקזוטיים.",
    "salePrice": 60.0,
    "onSale": true,
    "vintage": 2019,
    "volume": "750 מ\"ל",
    "grapeVariety": "60% קברנה-סוביניון, 30% מרלו, 10% ררה נגרה",
    "servingTemperature": "10-12°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2020/12/rose.png"
  },
  {
    "productName": "PINOT GRIGIO DE PURCARI",
    "price": 64.0,
    "sku": "PRC-PINOTGRIGI",
    "wineType": "White",
    "descriptionHe": "פינו גריג’יו דה פורקרי הוא יין עשיר ובעל טעם ארומטי.\nהצבע הבהיר והזהוב מתבטא בניחוח רענן המעוצב על ידי נגיעות עדינות של תפוח ירוק ואגס.",
    "salePrice": 60.0,
    "onSale": true,
    "vintage": 2019,
    "volume": "750 מ\"ל",
    "grapeVariety": "100% פינו גריגו",
    "servingTemperature": "10-12°",
    "featuredImage": "https://purcari.co.il/wp-content/uploads/2020/12/pinot-grigio.png"
  }
];

const CATEGORIES = [
  { name: "Wines", nameHe: "יינות", slug: "wines", parent: null },
  { name: "Red Wines", nameHe: "יינות אדומים", slug: "red-wines", parent: "wines" },
  { name: "White Wines", nameHe: "יינות לבנים", slug: "white-wines", parent: "wines" },
  { name: "Rosé Wines", nameHe: "יינות רוזה", slug: "rose-wines", parent: "wines" },
  { name: "Sparkling Wines", nameHe: "יינות מבעבעים", slug: "sparkling-wines", parent: "wines" },
];

function cleanObject(obj: any) {
  const cleaned: any = {};
  for (const key in obj) {
    if (obj[key] !== null && obj[key] !== undefined) cleaned[key] = obj[key];
  }
  return cleaned;
}

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const categoryMap: Record<string, any> = {};

    // 1. Create Category Hierarchy
    for (const cat of CATEGORIES) {
      let existing = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", cat.slug))
        .unique();

      if (!existing) {
        const parentId = cat.parent ? categoryMap[cat.parent] : undefined;
        const id = await ctx.db.insert("categories", {
          name: cat.name,
          nameHe: cat.nameHe,
          slug: cat.slug,
          parentId,
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        categoryMap[cat.slug] = id;
      } else {
        categoryMap[cat.slug] = existing._id;
      }
    }

    // 2. Map Wine Types to Slug
    const typeToSlug: Record<string, string> = {
      "Red": "red-wines",
      "White": "white-wines",
      "Rosé": "rose-wines",
      "Sparkling": "sparkling-wines"
    };

    // 3. Seed Products
    let count = 0;
    for (const p of PRODUCTS_DATA) {
      const categorySlug = typeToSlug[p.wineType] || "wines";
      const categoryId = categoryMap[categorySlug];

      const productToInsert = cleanObject({
        ...p,
        category: categoryId,
        quantityInStock: 50,
        status: "active",
        stockStatus: "in_stock",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const existing = await ctx.db
        .query("products")
        .withSearchIndex("search_en", (q) => q.search("productName", p.productName))
        .filter(q => q.eq(q.field("productName"), p.productName))
        .unique();

      if (!existing) {
        await ctx.db.insert("products", productToInsert);
        count++;
      }
    }

    return `Created hierarchy and seeded ${count} products into specific categories.`;
  },
});