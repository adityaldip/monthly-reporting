export type Language = 'id' | 'en';

export interface Translations {
  // Common
  common: {
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    close: string;
    search: string;
    filter: string;
    all: string;
    yes: string;
    no: string;
    confirm: string;
    success: string;
    error: string;
    warning: string;
  };
  
  // Navigation
  nav: {
    dashboard: string;
    transactions: string;
    reports: string;
    profile: string;
    settings: string;
    logout: string;
    login: string;
    register: string;
  };

  // Dashboard
  dashboard: {
    title: string;
    subtitle: string;
    totalIncome: string;
    totalOutcome: string;
    balance: string;
    quickActions: string;
    addIncome: string;
    addOutcome: string;
    recentTransactions: string;
    seeAll: string;
    displayIn: string;
    noTransactions: string;
    date: string;
    category: string;
    description: string;
    amount: string;
    amountOriginal: string;
    amountConverted: string;
  };

  // Transactions
  transactions: {
    title: string;
    subtitle: string;
    addIncome: string;
    addOutcome: string;
    income: string;
    outcome: string;
    noTransactions: string;
    date: string;
    category: string;
    description: string;
    amount: string;
    amountOriginal: string;
    amountConverted: string;
    currency: string;
  };

  // Transaction Modal
  transactionModal: {
    addIncome: string;
    addOutcome: string;
    transactionType: string;
    income: string;
    outcome: string;
    category: string;
    categoryRequired: string;
    amount: string;
    amountRequired: string;
    currency: string;
    currencyRequired: string;
    date: string;
    dateRequired: string;
    description: string;
    descriptionOptional: string;
    descriptionPlaceholder: string;
    saving: string;
    save: string;
    cancel: string;
    mustLogin: string;
    success: string;
    error: string;
  };

  // Settings
  settings: {
    title: string;
    subtitle: string;
    currencies: string;
    categories: string;
    code: string;
    name: string;
    symbol: string;
    exchangeRate: string;
    isDefault: string;
    default: string;
    type: string;
    icon: string;
    color: string;
    actions: string;
    addCurrency: string;
    editCurrency: string;
    deleteCurrency: string;
    addCategory: string;
    editCategory: string;
    deleteCategory: string;
    updateRates: string;
    confirmDelete: string;
    confirmDeleteCurrency: string;
    confirmDeleteCategory: string;
  };

  // Profile
  profile: {
    title: string;
    subtitle: string;
    personalInfo: string;
    email: string;
    fullName: string;
    phone: string;
    changePassword: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    update: string;
    updateSuccess: string;
    updateError: string;
  };

  // Auth
  auth: {
    login: string;
    register: string;
    email: string;
    password: string;
    fullName: string;
    phone: string;
    loginSuccess: string;
    loginError: string;
    registerSuccess: string;
    registerError: string;
    logout: string;
  };
}

export const translations: Record<Language, Translations> = {
  id: {
    common: {
      loading: 'Memuat...',
      save: 'Simpan',
      cancel: 'Batal',
      delete: 'Hapus',
      edit: 'Edit',
      add: 'Tambah',
      close: 'Tutup',
      search: 'Cari',
      filter: 'Filter',
      all: 'Semua',
      yes: 'Ya',
      no: 'Tidak',
      confirm: 'Konfirmasi',
      success: 'Berhasil',
      error: 'Error',
      warning: 'Peringatan',
    },
    nav: {
      dashboard: 'Dashboard',
      transactions: 'Transaksi',
      reports: 'Laporan',
      profile: 'Profil',
      settings: 'Pengaturan',
      logout: 'Keluar',
      login: 'Masuk',
      register: 'Daftar',
    },
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Ringkasan keuangan bulanan Anda',
      totalIncome: 'Total Pemasukan',
      totalOutcome: 'Total Pengeluaran',
      balance: 'Saldo',
      quickActions: 'Aksi Cepat',
      addIncome: 'Tambah Pemasukan',
      addOutcome: 'Tambah Pengeluaran',
      recentTransactions: 'Transaksi Terbaru',
      seeAll: 'Lihat Semua',
      displayIn: 'Tampilkan dalam',
      noTransactions: 'Belum ada transaksi. Mulai dengan menambahkan pemasukan atau pengeluaran.',
      date: 'Tanggal',
      category: 'Kategori',
      description: 'Deskripsi',
      amount: 'Jumlah',
      amountOriginal: 'Jumlah (Original)',
      amountConverted: 'Jumlah',
    },
    transactions: {
      title: 'Transaksi',
      subtitle: 'Kelola pemasukan dan pengeluaran Anda',
      addIncome: '+ Pemasukan',
      addOutcome: '+ Pengeluaran',
      income: 'Pemasukan',
      outcome: 'Pengeluaran',
      noTransactions: 'Belum ada transaksi. Mulai dengan menambahkan pemasukan atau pengeluaran.',
      date: 'Tanggal',
      category: 'Kategori',
      description: 'Deskripsi',
      amount: 'Jumlah',
      amountOriginal: 'Jumlah (Original)',
      amountConverted: 'Jumlah',
      currency: 'Currency',
    },
    transactionModal: {
      addIncome: 'Tambah Pemasukan',
      addOutcome: 'Tambah Pengeluaran',
      transactionType: 'Tipe Transaksi',
      income: 'Pemasukan',
      outcome: 'Pengeluaran',
      category: 'Kategori',
      categoryRequired: 'Kategori wajib diisi',
      amount: 'Jumlah',
      amountRequired: 'Jumlah wajib diisi',
      currency: 'Mata Uang',
      currencyRequired: 'Currency wajib diisi',
      date: 'Tanggal',
      dateRequired: 'Tanggal wajib diisi',
      description: 'Deskripsi',
      descriptionOptional: 'Deskripsi (Opsional)',
      descriptionPlaceholder: 'Tambahkan catatan atau deskripsi...',
      saving: 'Menyimpan...',
      save: 'Simpan',
      cancel: 'Batal',
      mustLogin: 'Anda harus login terlebih dahulu',
      success: 'Transaksi berhasil ditambahkan',
      error: 'Gagal menambahkan transaksi',
    },
    settings: {
      title: 'Pengaturan',
      subtitle: 'Kelola currency dan category Anda',
      currencies: 'Currencies',
      categories: 'Categories',
      code: 'Code',
      name: 'Name',
      symbol: 'Symbol',
      exchangeRate: 'Exchange Rate',
      isDefault: 'Default',
      default: 'Default',
      type: 'Type',
      icon: 'Icon',
      color: 'Color',
      actions: 'Actions',
      addCurrency: 'Add Currency',
      editCurrency: 'Edit Currency',
      deleteCurrency: 'Delete Currency',
      addCategory: 'Add Category',
      editCategory: 'Edit Category',
      deleteCategory: 'Delete Category',
      updateRates: 'Update Exchange Rates',
      confirmDelete: 'Apakah Anda yakin ingin menghapus?',
      confirmDeleteCurrency: 'Apakah Anda yakin ingin menghapus currency ini?',
      confirmDeleteCategory: 'Apakah Anda yakin ingin menghapus category ini?',
    },
    profile: {
      title: 'Profil',
      subtitle: 'Kelola informasi profil Anda',
      personalInfo: 'Informasi Pribadi',
      email: 'Email',
      fullName: 'Nama Lengkap',
      phone: 'Telepon',
      changePassword: 'Ubah Password',
      currentPassword: 'Password Saat Ini',
      newPassword: 'Password Baru',
      confirmPassword: 'Konfirmasi Password',
      update: 'Update',
      updateSuccess: 'Profil berhasil diupdate',
      updateError: 'Gagal mengupdate profil',
    },
    auth: {
      login: 'Masuk',
      register: 'Daftar',
      email: 'Email',
      password: 'Password',
      fullName: 'Nama Lengkap',
      phone: 'Telepon',
      loginSuccess: 'Login berhasil',
      loginError: 'Login gagal',
      registerSuccess: 'Registrasi berhasil',
      registerError: 'Registrasi gagal',
      logout: 'Keluar',
    },
  },
  en: {
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      close: 'Close',
      search: 'Search',
      filter: 'Filter',
      all: 'All',
      yes: 'Yes',
      no: 'No',
      confirm: 'Confirm',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
    },
    nav: {
      dashboard: 'Dashboard',
      transactions: 'Transactions',
      reports: 'Reports',
      profile: 'Profile',
      settings: 'Settings',
      logout: 'Logout',
      login: 'Login',
      register: 'Register',
    },
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Your monthly financial summary',
      totalIncome: 'Total Income',
      totalOutcome: 'Total Outcome',
      balance: 'Balance',
      quickActions: 'Quick Actions',
      addIncome: 'Add Income',
      addOutcome: 'Add Outcome',
      recentTransactions: 'Recent Transactions',
      seeAll: 'See All',
      displayIn: 'Display in',
      noTransactions: 'No transactions yet. Start by adding income or outcome.',
      date: 'Date',
      category: 'Category',
      description: 'Description',
      amount: 'Amount',
      amountOriginal: 'Amount (Original)',
      amountConverted: 'Amount',
    },
    transactions: {
      title: 'Transactions',
      subtitle: 'Manage your income and outcome',
      addIncome: '+ Income',
      addOutcome: '+ Outcome',
      income: 'Income',
      outcome: 'Outcome',
      noTransactions: 'No transactions yet. Start by adding income or outcome.',
      date: 'Date',
      category: 'Category',
      description: 'Description',
      amount: 'Amount',
      amountOriginal: 'Amount (Original)',
      amountConverted: 'Amount',
      currency: 'Currency',
    },
    transactionModal: {
      addIncome: 'Add Income',
      addOutcome: 'Add Outcome',
      transactionType: 'Transaction Type',
      income: 'Income',
      outcome: 'Outcome',
      category: 'Category',
      categoryRequired: 'Category is required',
      amount: 'Amount',
      amountRequired: 'Amount is required',
      currency: 'Currency',
      currencyRequired: 'Currency is required',
      date: 'Date',
      dateRequired: 'Date is required',
      description: 'Description',
      descriptionOptional: 'Description (Optional)',
      descriptionPlaceholder: 'Add a note or description...',
      saving: 'Saving...',
      save: 'Save',
      cancel: 'Cancel',
      mustLogin: 'You must login first',
      success: 'Transaction added successfully',
      error: 'Failed to add transaction',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Manage your currencies and categories',
      currencies: 'Currencies',
      categories: 'Categories',
      code: 'Code',
      name: 'Name',
      symbol: 'Symbol',
      exchangeRate: 'Exchange Rate',
      isDefault: 'Default',
      default: 'Default',
      type: 'Type',
      icon: 'Icon',
      color: 'Color',
      actions: 'Actions',
      addCurrency: 'Add Currency',
      editCurrency: 'Edit Currency',
      deleteCurrency: 'Delete Currency',
      addCategory: 'Add Category',
      editCategory: 'Edit Category',
      deleteCategory: 'Delete Category',
      updateRates: 'Update Exchange Rates',
      confirmDelete: 'Are you sure you want to delete?',
      confirmDeleteCurrency: 'Are you sure you want to delete this currency?',
      confirmDeleteCategory: 'Are you sure you want to delete this category?',
    },
    profile: {
      title: 'Profile',
      subtitle: 'Manage your profile information',
      personalInfo: 'Personal Information',
      email: 'Email',
      fullName: 'Full Name',
      phone: 'Phone',
      changePassword: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      update: 'Update',
      updateSuccess: 'Profile updated successfully',
      updateError: 'Failed to update profile',
    },
    auth: {
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      fullName: 'Full Name',
      phone: 'Phone',
      loginSuccess: 'Login successful',
      loginError: 'Login failed',
      registerSuccess: 'Registration successful',
      registerError: 'Registration failed',
      logout: 'Logout',
    },
  },
};

