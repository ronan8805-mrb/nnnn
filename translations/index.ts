/**
 * SLÁN Multilingual Translation System
 * Ready for: EN, GA (Irish), PL, RO, PT, FR, ES
 * Top immigrant languages in Ireland supported for future rollout
 */

export type LanguageCode = 'en' | 'ga' | 'pl' | 'ro' | 'pt' | 'fr' | 'es';

export interface TranslationSet {
    // Auth
    welcome: string;
    login: string;
    register: string;
    logout: string;
    // Home
    immediateAssistance: string;
    oneTapAlert: string;
    crimeMap: string;
    safeWalk: string;
    report: string;
    guardians: string;
    feed: string;
    medical: string;
    // SOS
    sosActivated: string;
    helpOnWay: string;
    cancelSOS: string;
    iAmSafe: string;
    silentSOS: string;
    // Child
    pressForHelp: string;
    callParent: string;
    youAreProtected: string;
    // Emergency Services
    call999: string;
    requestAmbulance: string;
    requestFire: string;
    // Garda
    gardaDashboard: string;
    analytics: string;
    smartwatch: string;
    // General
    back: string;
    settings: string;
    loading: string;
    error: string;
    success: string;
    offline: string;
    offlineWarning: string;
}

const translations: Record<LanguageCode, TranslationSet> = {
    en: {
        welcome: "Welcome to SLÁN",
        login: "Sign In",
        register: "Register",
        logout: "Log Out",
        immediateAssistance: "Immediate Assistance",
        oneTapAlert: "One tap to alert Gardaí and Guardians",
        crimeMap: "Crime Map",
        safeWalk: "Safe Walk",
        report: "Report",
        guardians: "Guardians",
        feed: "Feed",
        medical: "Medical",
        sosActivated: "SOS ACTIVATED",
        helpOnWay: "Help is on the way",
        cancelSOS: "Cancel SOS",
        iAmSafe: "I'm Safe",
        silentSOS: "Silent SOS",
        pressForHelp: "Press if you need help",
        callParent: "Call Parent",
        youAreProtected: "You are protected",
        call999: "Call 999",
        requestAmbulance: "Request Ambulance",
        requestFire: "Request Fire Brigade",
        gardaDashboard: "Garda Dashboard",
        analytics: "Analytics",
        smartwatch: "Smartwatch",
        back: "Back",
        settings: "Settings",
        loading: "Loading...",
        error: "Error",
        success: "Success",
        offline: "Offline",
        offlineWarning: "No network — SOS will be sent when signal returns",
    },
    ga: {
        welcome: "Fáilte go SLÁN",
        login: "Sínigh Isteach",
        register: "Cláraigh",
        logout: "Logáil Amach",
        immediateAssistance: "Cabhair Láithreach",
        oneTapAlert: "Brúigh uair amháin chun na Gardaí agus Caomhnóirí a chur ar an eolas",
        crimeMap: "Léarscáil na Coireachta",
        safeWalk: "Siúlóid Sábháilte",
        report: "Tuairiscigh",
        guardians: "Caomhnóirí",
        feed: "Nuacht",
        medical: "Leigheas",
        sosActivated: "SOS GNÍOMHAITHE",
        helpOnWay: "Tá cabhair ar an mbealach",
        cancelSOS: "Cealaigh SOS",
        iAmSafe: "Tá mé sábháilte",
        silentSOS: "SOS Ciúin",
        pressForHelp: "Brúigh má theastaíonn cabhair uait",
        callParent: "Glaoigh ar Tuismitheoir",
        youAreProtected: "Tá tú cosanta",
        call999: "Glaoigh 999",
        requestAmbulance: "Iarr Otharcharr",
        requestFire: "Iarr Briogáid Dóiteáin",
        gardaDashboard: "Painéal na nGardaí",
        analytics: "Anailísíocht",
        smartwatch: "Uaireadóir Cliste",
        back: "Ar ais",
        settings: "Socruithe",
        loading: "Ag lódáil...",
        error: "Earráid",
        success: "Éiríonn",
        offline: "As líne",
        offlineWarning: "Gan líonra — Seolfar SOS nuair a fhilleann an comhartha",
    },
    pl: {
        welcome: "Witamy w SLÁN",
        login: "Zaloguj się",
        register: "Zarejestruj się",
        logout: "Wyloguj",
        immediateAssistance: "Natychmiastowa pomoc",
        oneTapAlert: "Jedno dotknięcie, aby powiadomić Gardaí i Opiekunów",
        crimeMap: "Mapa przestępczości",
        safeWalk: "Bezpieczny spacer",
        report: "Zgłoś",
        guardians: "Opiekunowie",
        feed: "Aktualności",
        medical: "Medyczne",
        sosActivated: "SOS AKTYWOWANE",
        helpOnWay: "Pomoc jest w drodze",
        cancelSOS: "Anuluj SOS",
        iAmSafe: "Jestem bezpieczny",
        silentSOS: "Cichy SOS",
        pressForHelp: "Naciśnij, jeśli potrzebujesz pomocy",
        callParent: "Zadzwoń do rodzica",
        youAreProtected: "Jesteś chroniony",
        call999: "Zadzwoń 999",
        requestAmbulance: "Wezwij karetkę",
        requestFire: "Wezwij straż pożarną",
        gardaDashboard: "Panel Garda",
        analytics: "Analityka",
        smartwatch: "Smartwatch",
        back: "Wstecz",
        settings: "Ustawienia",
        loading: "Ładowanie...",
        error: "Błąd",
        success: "Sukces",
        offline: "Offline",
        offlineWarning: "Brak sieci — SOS zostanie wysłany po przywróceniu sygnału",
    },
    ro: {
        welcome: "Bun venit la SLÁN",
        login: "Autentificare",
        register: "Înregistrare",
        logout: "Deconectare",
        immediateAssistance: "Asistență imediată",
        oneTapAlert: "O atingere pentru a alerta Gardaí și Gardienii",
        crimeMap: "Harta criminalității",
        safeWalk: "Plimbare sigură",
        report: "Raportare",
        guardians: "Gardieni",
        feed: "Noutăți",
        medical: "Medical",
        sosActivated: "SOS ACTIVAT",
        helpOnWay: "Ajutorul este pe drum",
        cancelSOS: "Anulare SOS",
        iAmSafe: "Sunt în siguranță",
        silentSOS: "SOS Silențios",
        pressForHelp: "Apasă dacă ai nevoie de ajutor",
        callParent: "Sună părintele",
        youAreProtected: "Ești protejat",
        call999: "Sună 999",
        requestAmbulance: "Solicită ambulanță",
        requestFire: "Solicită pompieri",
        gardaDashboard: "Panou Garda",
        analytics: "Analize",
        smartwatch: "Smartwatch",
        back: "Înapoi",
        settings: "Setări",
        loading: "Se încarcă...",
        error: "Eroare",
        success: "Succes",
        offline: "Offline",
        offlineWarning: "Fără rețea — SOS va fi trimis la revenirea semnalului",
    },
    pt: {
        welcome: "Bem-vindo ao SLÁN",
        login: "Entrar",
        register: "Registar",
        logout: "Sair",
        immediateAssistance: "Assistência Imediata",
        oneTapAlert: "Um toque para alertar a Gardaí e Guardiões",
        crimeMap: "Mapa de Crime",
        safeWalk: "Caminhada Segura",
        report: "Reportar",
        guardians: "Guardiões",
        feed: "Notícias",
        medical: "Médico",
        sosActivated: "SOS ATIVADO",
        helpOnWay: "A ajuda está a caminho",
        cancelSOS: "Cancelar SOS",
        iAmSafe: "Estou seguro",
        silentSOS: "SOS Silencioso",
        pressForHelp: "Prima se precisar de ajuda",
        callParent: "Ligar aos pais",
        youAreProtected: "Está protegido",
        call999: "Ligar 999",
        requestAmbulance: "Solicitar Ambulância",
        requestFire: "Solicitar Bombeiros",
        gardaDashboard: "Painel Garda",
        analytics: "Análises",
        smartwatch: "Smartwatch",
        back: "Voltar",
        settings: "Definições",
        loading: "A carregar...",
        error: "Erro",
        success: "Sucesso",
        offline: "Offline",
        offlineWarning: "Sem rede — SOS será enviado quando o sinal voltar",
    },
    fr: {
        welcome: "Bienvenue à SLÁN",
        login: "Se connecter",
        register: "S'inscrire",
        logout: "Déconnexion",
        immediateAssistance: "Assistance immédiate",
        oneTapAlert: "Un tap pour alerter les Gardaí et les Gardiens",
        crimeMap: "Carte de criminalité",
        safeWalk: "Marche sécurisée",
        report: "Signaler",
        guardians: "Gardiens",
        feed: "Actualités",
        medical: "Médical",
        sosActivated: "SOS ACTIVÉ",
        helpOnWay: "L'aide est en route",
        cancelSOS: "Annuler SOS",
        iAmSafe: "Je suis en sécurité",
        silentSOS: "SOS Silencieux",
        pressForHelp: "Appuyez si vous avez besoin d'aide",
        callParent: "Appeler parent",
        youAreProtected: "Vous êtes protégé",
        call999: "Appeler 999",
        requestAmbulance: "Demander ambulance",
        requestFire: "Demander pompiers",
        gardaDashboard: "Tableau de bord Garda",
        analytics: "Analyses",
        smartwatch: "Montre connectée",
        back: "Retour",
        settings: "Paramètres",
        loading: "Chargement...",
        error: "Erreur",
        success: "Succès",
        offline: "Hors ligne",
        offlineWarning: "Pas de réseau — SOS sera envoyé au retour du signal",
    },
    es: {
        welcome: "Bienvenido a SLÁN",
        login: "Iniciar sesión",
        register: "Registrarse",
        logout: "Cerrar sesión",
        immediateAssistance: "Asistencia inmediata",
        oneTapAlert: "Un toque para alertar a los Gardaí y Guardianes",
        crimeMap: "Mapa de delitos",
        safeWalk: "Caminata segura",
        report: "Reportar",
        guardians: "Guardianes",
        feed: "Noticias",
        medical: "Médico",
        sosActivated: "SOS ACTIVADO",
        helpOnWay: "La ayuda está en camino",
        cancelSOS: "Cancelar SOS",
        iAmSafe: "Estoy a salvo",
        silentSOS: "SOS Silencioso",
        pressForHelp: "Presione si necesita ayuda",
        callParent: "Llamar a padres",
        youAreProtected: "Estás protegido",
        call999: "Llamar 999",
        requestAmbulance: "Solicitar ambulancia",
        requestFire: "Solicitar bomberos",
        gardaDashboard: "Panel de Garda",
        analytics: "Análisis",
        smartwatch: "Reloj inteligente",
        back: "Atrás",
        settings: "Configuración",
        loading: "Cargando...",
        error: "Error",
        success: "Éxito",
        offline: "Sin conexión",
        offlineWarning: "Sin red — SOS se enviará cuando vuelva la señal",
    },
};

export function getTranslation(lang: LanguageCode): TranslationSet {
    return translations[lang] || translations.en;
}

export const supportedLanguages: { code: LanguageCode; name: string; nativeName: string }[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ga', name: 'Irish', nativeName: 'Gaeilge' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski' },
    { code: 'ro', name: 'Romanian', nativeName: 'Română' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
];

export default translations;
