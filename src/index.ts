Simport {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  ActivityType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChatInputCommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  Interaction,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  GuildMember,
  ChannelType,
  OverwriteType,
  Guild,
  TextChannel,
  Message,
} from "discord.js";

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const VERIFIED_ROLE_ID = process.env.DISCORD_VERIFIED_ROLE_ID;

if ( OTEwNzYzNDUyMTUzMzY0NDkwGK6urgBctGucjXBIxm9UGLSRtkfdgfBuEYQ6f8lS9g || 893882601784377386 || !VERIFIED_ROLE_ID) {
  console.error(
    "Missing required env: DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, DISCORD_VERIFIED_ROLE_ID",
  );
  process.exit(1);
}

const PURPLE = 0x8b5cf6;

type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  emoji: string;
  grantRoleEnv?: string;
};

const PRODUCTS: Product[] = [
  {
    id: "premium-role",
    name: "Premium Member Role",
    price: 50000,
    description: "Akses role premium dengan warna khusus & perks eksklusif.",
    emoji: "💎",
    grantRoleEnv: "DISCORD_PREMIUM_ROLE_ID",
  },
  {
    id: "vip-channel",
    name: "VIP Channel Access",
    price: 75000,
    description: "Akses ke private VIP channel dengan komunitas tertutup.",
    emoji: "👑",
    grantRoleEnv: "DISCORD_VIP_ROLE_ID",
  },
  {
    id: "custom-bot",
    name: "Custom Bot Setup",
    price: 250000,
    description: "Setup bot Discord custom untuk server Anda.",
    emoji: "🤖",
  },
  {
    id: "design-pack",
    name: "Design Pack (Banner + Logo)",
    price: 100000,
    description: "Banner server + logo custom didesain profesional.",
    emoji: "🎨",
  },
  {
    id: "boost-server",
    name: "Server Boost x2",
    price: 150000,
    description: "Bantu boost server Anda level 2.",
    emoji: "🚀",
  },
];

type PaymentMethod = {
  id: string;
  label: string;
  emoji: string;
  type: "qris" | "bank" | "ewallet";
  details: string;
  imageUrl?: string;
};

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "qris",
    label: "QRIS (All E-Wallet & M-Banking)",
    emoji: "📱",
    type: "qris",
    details:
      "Scan QR di bawah ini menggunakan aplikasi e-wallet (DANA, OVO, GoPay, ShopeePay) atau m-banking apa saja. Nominal akan otomatis sesuai harga produk.",
    imageUrl: process.env.QRIS_IMAGE_URL || "",
  },
  {
    id: "bca",
    label: "Bank BCA",
    emoji: "🏦",
    type: "bank",
    details:
      "**Bank**: BCA\n**No. Rekening**: `1234567890`\n**Atas Nama**: Tory Store SAMP\n\nTransfer sesuai nominal produk. Mohon transfer dengan kode unik (3 digit terakhir) jika diminta admin.",
  },
  {
    id: "mandiri",
    label: "Bank Mandiri",
    emoji: "🏦",
    type: "bank",
    details:
      "**Bank**: Mandiri\n**No. Rekening**: `1440011223344`\n**Atas Nama**: Tory Store SAMP\n\nTransfer sesuai nominal produk.",
  },
  {
    id: "dana",
    label: "DANA",
    emoji: "💸",
    type: "ewallet",
    details:
      "**E-Wallet**: DANA\n**Nomor**: `0812-3456-7890`\n**Atas Nama**: Tory Store SAMP",
  },
  {
    id: "gopay",
    label: "GoPay",
    emoji: "💚",
    type: "ewallet",
    details:
      "**E-Wallet**: GoPay\n**Nomor**: `0812-3456-7890`\n**Atas Nama**: Tory Store SAMP",
  },
  {
    id: "ovo",
    label: "OVO",
    emoji: "💜",
    type: "ewallet",
    details:
      "**E-Wallet**: OVO\n**Nomor**: `0812-3456-7890`\n**Atas Nama**: Tory Store SAMP",
  },
];

type OrderStatus = "pending_payment" | "waiting_verification" | "paid" | "cancelled";

type Order = {
  orderId: string;
  userId: string;
  productId: string;
  productName: string;
  price: number;
  contact: string;
  note: string;
  createdAt: number;
  status: OrderStatus;
  paymentMethod?: string;
  proofUrl?: string;
};

const ORDERS = new Map<string, Order>();
let orderCounter = 1000;

type CoinBalance = { coins: number; lastDaily: number };
const BALANCES = new Map<string, CoinBalance>();

function getBalance(userId: string): CoinBalance {
  let b = BALANCES.get(userId);
  if (!b) {
    b = { coins: 100, lastDaily: 0 };
    BALANCES.set(userId, b);
  }
  return b;
}

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

const commands = [
  new SlashCommandBuilder()
    .setName("setup-verify")
    .setDescription("Kirim panel verifikasi ke channel ini (admin only).")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName("setup-store")
    .setDescription("Kirim panel store ke channel ini (admin only).")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName("setup-game")
    .setDescription("Kirim panel game ke channel ini (admin only).")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName("setup-ticket")
    .setDescription("Kirim panel tiket ke channel ini (admin only).")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName("store")
    .setDescription("Tampilkan daftar produk."),
  new SlashCommandBuilder()
    .setName("game")
    .setDescription("Tampilkan menu game."),
  new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Cek saldo coin Anda."),
  new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Klaim coin harian (100 coin)."),
  new SlashCommandBuilder()
    .setName("orders")
    .setDescription("Lihat order terbaru (admin only).")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Kirim pengumuman embed ungu ke channel (admin only).")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) =>
      o.setName("judul").setDescription("Judul pengumuman").setRequired(true).setMaxLength(256),
    )
    .addStringOption((o) =>
      o.setName("pesan").setDescription("Isi pengumuman").setRequired(true).setMaxLength(4000),
    )
    .addChannelOption((o) =>
      o
        .setName("channel")
        .setDescription("Channel tujuan (default: channel ini)")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false),
    )
    .addBooleanOption((o) =>
      o.setName("mention_everyone").setDescription("Mention @everyone").setRequired(false),
    ),
].map((c) => c.toJSON());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.GuildMember, Partials.Channel, Partials.Message],
});

type PendingProof = { orderId: string; ownerId: string; expiresAt: number };
const PENDING_PROOFS_BY_CHANNEL = new Map<string, PendingProof>();

type TicketType = "order" | "support" | "complaint" | "manual_order";
type Ticket = { ownerId: string; type: TicketType; orderId?: string };
const TICKETS = new Map<string, Ticket>();
let ticketCounter = 100;

const TICKET_CATEGORY_ID = process.env.DISCORD_TICKET_CATEGORY_ID;
const STAFF_ROLE_ID = process.env.DISCORD_STAFF_ROLE_ID;

async function createTicketChannel(
  guild: Guild,
  ownerId: string,
  type: TicketType,
  label: string,
  orderId?: string,
): Promise<TextChannel> {
  const num = ++ticketCounter;
  const owner = await guild.members.fetch(ownerId).catch(() => null);
  const ownerName = (owner?.user.username || "user")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 12) || "user";
  const channelName = `${label}-${num}-${ownerName}`.slice(0, 90);

  const overwrites: any[] = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
      type: OverwriteType.Role,
    },
    {
      id: ownerId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
      type: OverwriteType.Member,
    },
    {
      id: client.user!.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
      type: OverwriteType.Member,
    },
  ];
  if (STAFF_ROLE_ID) {
    overwrites.push({
      id: STAFF_ROLE_ID,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.AttachFiles,
      ],
      type: OverwriteType.Role,
    });
  }

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: TICKET_CATEGORY_ID || undefined,
    permissionOverwrites: overwrites,
    topic: `Tiket ${type} • Owner: ${ownerId}${orderId ? ` • Order: ${orderId}` : ""}`,
  });

  TICKETS.set(channel.id, { ownerId, type, orderId });
  return channel;
}

function buildTicketCloseRow(orderIdOrChannel: string) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticket_close:${orderIdOrChannel}`)
      .setLabel("🔒 Tutup Tiket")
      .setStyle(ButtonStyle.Secondary),
  );
}

function buildTicketPanel() {
  const embed = new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle("🎫 SISTEM TIKET")
    .setDescription(
      [
        "Butuh bantuan? Buat tiket privat dengan staff kami.",
        "",
        "**Kategori tiket:**",
        "🛒 **Order Manual** — pesan produk di luar daftar /store",
        "❓ **Bantuan** — pertanyaan umum / cara pakai",
        "⚠️ **Komplain** — masalah pesanan / pengaduan",
        "",
        "Pilih kategori di bawah, channel privat akan dibuat otomatis.",
      ].join("\n"),
    )
    .setFooter({ text: "1 user = 1 tiket aktif per kategori" });

  const select = new StringSelectMenuBuilder()
    .setCustomId("ticket_create")
    .setPlaceholder("Pilih kategori tiket...")
    .addOptions([
      { label: "Order Manual", value: "manual_order", emoji: "🛒" },
      { label: "Bantuan / Support", value: "support", emoji: "❓" },
      { label: "Komplain", value: "complaint", emoji: "⚠️" },
    ]);

  return {
    embeds: [embed],
    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)],
  };
}

async function handleTicketCreate(i: StringSelectMenuInteraction) {
  if (!i.guild) return;
  const type = i.values[0] as TicketType;
  const labelMap: Record<string, string> = {
    manual_order: "order",
    support: "bantuan",
    complaint: "komplain",
  };
  const titleMap: Record<string, string> = {
    manual_order: "🛒 Tiket Order Manual",
    support: "❓ Tiket Bantuan",
    complaint: "⚠️ Tiket Komplain",
  };

  const existing = Array.from(TICKETS.entries()).find(
    ([, t]) => t.ownerId === i.user.id && t.type === type,
  );
  if (existing) {
    const ch = await i.guild.channels.fetch(existing[0]).catch(() => null);
    if (ch) {
      await i.reply({
        content: `⚠️ Kamu sudah punya tiket aktif: <#${existing[0]}>`,
        ephemeral: true,
      });
      return;
    }
    TICKETS.delete(existing[0]);
  }

  await i.deferReply({ ephemeral: true });
  try {
    const channel = await createTicketChannel(
      i.guild,
      i.user.id,
      type,
      labelMap[type] || "tiket",
    );
    const welcome = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle(titleMap[type])
      .setDescription(
        [
          `Halo <@${i.user.id}>, terima kasih sudah menghubungi kami!`,
          "",
          "Silakan jelaskan kebutuhanmu di sini. Staff akan merespon segera.",
          "",
          "Kalau perlu kirim foto/dokumen, langsung **lampirkan di chat ini**.",
        ].join("\n"),
      )
      .setFooter({ text: "Klik 🔒 Tutup Tiket jika sudah selesai" });

    const mentions = STAFF_ROLE_ID ? `<@${i.user.id}> <@&${STAFF_ROLE_ID}>` : `<@${i.user.id}>`;
    await channel.send({
      content: mentions,
      embeds: [welcome],
      components: [buildTicketCloseRow(channel.id)],
      allowedMentions: { users: [i.user.id], roles: STAFF_ROLE_ID ? [STAFF_ROLE_ID] : [] },
    });

    await i.editReply({ content: `✅ Tiket dibuat: <#${channel.id}>` });
  } catch (err) {
    console.error("Create ticket failed:", err);
    await i.editReply({
      content:
        "❌ Gagal membuat tiket. Pastikan bot punya permission **Manage Channels** & **Manage Roles**.",
    });
  }
}

async function handleTicketClose(i: ButtonInteraction) {
  if (!i.channel || !i.guild) return;
  const ticket = TICKETS.get(i.channel.id);
  const member = i.member as GuildMember | null;
  const isStaff = member?.permissions.has(PermissionFlagsBits.ManageChannels) ||
    (STAFF_ROLE_ID && member?.roles.cache.has(STAFF_ROLE_ID));
  const isOwner = ticket?.ownerId === i.user.id;
  if (!ticket && !isStaff) {
    await i.reply({ content: "❌ Bukan tiket valid.", ephemeral: true });
    return;
  }
  if (!isOwner && !isStaff) {
    await i.reply({ content: "❌ Hanya pemilik tiket atau staff yang bisa menutup.", ephemeral: true });
    return;
  }
  await i.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x6b7280)
        .setTitle("🔒 Tiket akan ditutup dalam 5 detik...")
        .setDescription(`Ditutup oleh <@${i.user.id}>.`),
    ],
  });
  setTimeout(async () => {
    try {
      TICKETS.delete(i.channel!.id);
      PENDING_PROOFS_BY_CHANNEL.delete(i.channel!.id);
      await (i.channel as TextChannel).delete(`Closed by ${i.user.username}`);
    } catch (err) {
      console.error("Close ticket failed:", err);
    }
  }, 5000);
}

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN!);
  await rest.put(
    Routes.applicationGuildCommands(client.user!.id, GUILD_ID!),
    { body: commands },
  );
  console.log(`Registered ${commands.length} guild commands.`);
}

function setStreamingPresence() {
  client.user?.setPresence({
    activities: [
      {
        name: "Tory Store SAMP",
        type: ActivityType.Streaming,
        url: "https://www.twitch.tv/discord",
      },
    ],
    status: "online",
  });
}

client.once(Events.ClientReady, async (c) => {
  console.log(`Bot logged in as ${c.user.tag}`);
  setStreamingPresence();
  setInterval(setStreamingPresence, 5 * 60 * 1000);
  try {
    await registerCommands();
  } catch (err) {
    console.error("Failed to register commands:", err);
  }
});

function buildVerifyPanel() {
  const embed = new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle("✦ VERIFIKASI MEMBER ✦")
    .setDescription(
      [
        "Selamat datang di server kami!",
        "",
        "Untuk mengakses semua channel dan mendapatkan role **Member**,",
        "klik tombol **Verify** di bawah ini.",
        "",
        "🔒 Verifikasi membantu menjaga server tetap aman dari bot/spam.",
      ].join("\n"),
    )
    .setFooter({ text: "Tekan tombol di bawah untuk verifikasi" });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("verify_btn")
      .setLabel("✓ Verify Saya")
      .setStyle(ButtonStyle.Success),
  );

  return { embeds: [embed], components: [row] };
}

function buildStorePanel() {
  const embed = new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle("🛒 STORE — Produk Kami")
    .setDescription(
      "Pilih produk yang ingin dibeli pada menu di bawah ini.\nSetelah memilih, isi form pemesanan.",
    )
    .addFields(
      PRODUCTS.map((p) => ({
        name: `${p.emoji} ${p.name} — ${formatRupiah(p.price)}`,
        value: p.description,
      })),
    )
    .setFooter({ text: "Klik menu untuk memesan" });

  const select = new StringSelectMenuBuilder()
    .setCustomId("store_select")
    .setPlaceholder("Pilih produk...")
    .addOptions(
      PRODUCTS.map((p) => ({
        label: p.name,
        description: formatRupiah(p.price),
        value: p.id,
        emoji: p.emoji,
      })),
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    select,
  );

  return { embeds: [embed], components: [row] };
}

function buildGamePanel() {
  const embed = new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle("🎮 GAME CENTER")
    .setDescription(
      [
        "Mainkan game seru dan kumpulkan **coin** 🪙",
        "Coin bisa dipakai untuk diskon di store (segera!).",
        "",
        "**Game tersedia:**",
        "🎰 **Slot** — Pasang taruhan, raih jackpot",
        "🎲 **Dadu** — Tebak besar/kecil",
        "✊ **Suit** — Batu Gunting Kertas vs bot",
        "🪙 **Coinflip** — Tebak sisi koin",
        "",
        "Gunakan `/daily` untuk klaim 100 coin gratis tiap hari!",
      ].join("\n"),
    );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("game_slot")
      .setLabel("🎰 Slot")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("game_dice")
      .setLabel("🎲 Dadu")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("game_rps")
      .setLabel("✊ Suit")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("game_coin")
      .setLabel("🪙 Coinflip")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("game_balance")
      .setLabel("💰 Balance")
      .setStyle(ButtonStyle.Secondary),
  );

  return { embeds: [embed], components: [row] };
}

async function handleVerify(i: ButtonInteraction) {
  if (!i.guild) return;
  const member = i.member as GuildMember;
  if (member.roles.cache.has(VERIFIED_ROLE_ID!)) {
    await i.reply({
      content: "✅ Kamu sudah terverifikasi sebelumnya.",
      ephemeral: true,
    });
    return;
  }
  try {
    await member.roles.add(VERIFIED_ROLE_ID!, "User clicked verify");
    await i.reply({
      content:
        "🎉 Verifikasi berhasil! Kamu sekarang bisa mengakses channel member.",
      ephemeral: true,
    });
  } catch (err) {
    console.error("Verify failed:", err);
    await i.reply({
      content:
        "❌ Gagal memberikan role. Pastikan posisi role bot lebih tinggi dari role member, dan bot punya permission **Manage Roles**.",
      ephemeral: true,
    });
  }
}

async function handleStoreSelect(i: StringSelectMenuInteraction) {
  const productId = i.values[0];
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) {
    await i.reply({ content: "Produk tidak ditemukan.", ephemeral: true });
    return;
  }
  const modal = new ModalBuilder()
    .setCustomId(`order_modal:${product.id}`)
    .setTitle(`Pesan: ${product.name}`.slice(0, 45));

  const contact = new TextInputBuilder()
    .setCustomId("contact")
    .setLabel("Kontak (WA / Email / Discord)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);

  const note = new TextInputBuilder()
    .setCustomId("note")
    .setLabel("Catatan / Detail Pesanan")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setMaxLength(500);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(contact),
    new ActionRowBuilder<TextInputBuilder>().addComponents(note),
  );

  await i.showModal(modal);
}

async function handleOrderSubmit(i: ModalSubmitInteraction) {
  if (!i.guild) {
    await i.reply({ content: "❌ Hanya bisa dipakai di server.", ephemeral: true });
    return;
  }
  const productId = i.customId.split(":")[1];
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) {
    await i.reply({ content: "Produk tidak valid.", ephemeral: true });
    return;
  }
  const contact = i.fields.getTextInputValue("contact");
  const note = i.fields.getTextInputValue("note") || "-";
  const orderId = `ORD-${++orderCounter}`;

  const order: Order = {
    orderId,
    userId: i.user.id,
    productId: product.id,
    productName: product.name,
    price: product.price,
    contact,
    note,
    createdAt: Date.now(),
    status: "pending_payment",
  };
  ORDERS.set(orderId, order);

  await i.deferReply({ ephemeral: true });

  let ticketChannel: TextChannel;
  try {
    ticketChannel = await createTicketChannel(
      i.guild,
      i.user.id,
      "order",
      `order-${orderId.toLowerCase()}`,
      orderId,
    );
  } catch (err) {
    console.error("Create order ticket failed:", err);
    await i.editReply({
      content:
        "❌ Gagal membuat tiket order. Pastikan bot punya permission **Manage Channels** & **Manage Roles**.",
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle("✅ Pesanan Dibuat — Pilih Pembayaran")
    .setDescription(
      `Halo <@${i.user.id}>! Pesananmu sudah dibuat. Silakan pilih metode pembayaran di bawah.`,
    )
    .addFields(
      { name: "Order ID", value: `\`${orderId}\``, inline: true },
      { name: "Produk", value: `${product.emoji} ${product.name}`, inline: true },
      { name: "Total", value: `**${formatRupiah(product.price)}**`, inline: true },
      { name: "Kontak", value: contact, inline: false },
      { name: "Catatan", value: note, inline: false },
    )
    .setFooter({ text: "Pesanan kadaluarsa jika tidak dibayar dalam 24 jam" });

  const select = new StringSelectMenuBuilder()
    .setCustomId(`pay_select:${orderId}`)
    .setPlaceholder("Pilih metode pembayaran...")
    .addOptions(
      PAYMENT_METHODS.map((m) => ({
        label: m.label,
        value: m.id,
        emoji: m.emoji,
      })),
    );

  const cancelRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`order_cancel:${orderId}`)
      .setLabel("Batalkan Pesanan")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`ticket_close:${ticketChannel.id}`)
      .setLabel("🔒 Tutup Tiket")
      .setStyle(ButtonStyle.Secondary),
  );

  const mentions = STAFF_ROLE_ID ? `<@${i.user.id}> <@&${STAFF_ROLE_ID}>` : `<@${i.user.id}>`;
  await ticketChannel.send({
    content: mentions,
    embeds: [embed],
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select),
      cancelRow,
    ],
    allowedMentions: { users: [i.user.id], roles: STAFF_ROLE_ID ? [STAFF_ROLE_ID] : [] },
  });

  await i.editReply({
    content: `✅ Tiket order kamu sudah dibuat: <#${ticketChannel.id}>\nLanjutkan pembayaran di sana.`,
  });
}

async function handlePaymentSelect(i: StringSelectMenuInteraction) {
  const orderId = i.customId.split(":")[1];
  const order = ORDERS.get(orderId);
  if (!order) {
    await i.update({ content: "❌ Pesanan tidak ditemukan.", embeds: [], components: [] });
    return;
  }
  const methodId = i.values[0];
  const method = PAYMENT_METHODS.find((m) => m.id === methodId);
  if (!method) return;
  order.paymentMethod = method.id;

  const embed = new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle(`${method.emoji} Pembayaran via ${method.label}`)
    .setDescription(method.details)
    .addFields(
      { name: "Order ID", value: `\`${orderId}\``, inline: true },
      { name: "Produk", value: order.productName, inline: true },
      { name: "Total Bayar", value: `**${formatRupiah(order.price)}**`, inline: true },
    )
    .setFooter({
      text: "Setelah transfer, klik 'Upload Bukti Bayar' lalu kirim foto di channel ini.",
    });

  if (method.type === "qris") {
    if (method.imageUrl) {
      embed.setImage(method.imageUrl);
    } else {
      embed.addFields({
        name: "⚠️ QR belum diatur",
        value:
          "Admin belum upload gambar QRIS. Mohon admin set env var `QRIS_IMAGE_URL` dengan URL gambar QR.",
      });
    }
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`pay_proof:${orderId}`)
      .setLabel("📤 Upload Bukti Bayar")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`pay_change:${orderId}`)
      .setLabel("🔄 Ganti Metode")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`order_cancel:${orderId}`)
      .setLabel("Batalkan")
      .setStyle(ButtonStyle.Danger),
  );

  await i.update({ embeds: [embed], components: [row] });
}

async function handlePaymentChange(i: ButtonInteraction) {
  const orderId = i.customId.split(":")[1];
  const order = ORDERS.get(orderId);
  if (!order) {
    await i.update({ content: "❌ Pesanan tidak ditemukan.", embeds: [], components: [] });
    return;
  }
  const product = PRODUCTS.find((p) => p.id === order.productId)!;
  const embed = new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle("✅ Pesanan Dibuat — Pilih Pembayaran")
    .addFields(
      { name: "Order ID", value: `\`${orderId}\``, inline: true },
      { name: "Produk", value: `${product.emoji} ${product.name}`, inline: true },
      { name: "Total", value: `**${formatRupiah(product.price)}**`, inline: true },
    );
  const select = new StringSelectMenuBuilder()
    .setCustomId(`pay_select:${orderId}`)
    .setPlaceholder("Pilih metode pembayaran...")
    .addOptions(
      PAYMENT_METHODS.map((m) => ({
        label: m.label,
        value: m.id,
        emoji: m.emoji,
      })),
    );
  const cancelRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`order_cancel:${orderId}`)
      .setLabel("Batalkan Pesanan")
      .setStyle(ButtonStyle.Danger),
  );
  await i.update({
    embeds: [embed],
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select),
      cancelRow,
    ],
  });
}

async function handleOrderCancel(i: ButtonInteraction) {
  const orderId = i.customId.split(":")[1];
  const order = ORDERS.get(orderId);
  if (!order) {
    await i.update({ content: "❌ Pesanan tidak ditemukan.", embeds: [], components: [] });
    return;
  }
  order.status = "cancelled";
  const embed = new EmbedBuilder()
    .setColor(0x6b7280)
    .setTitle("🚫 Pesanan Dibatalkan")
    .setDescription(`Pesanan \`${orderId}\` telah dibatalkan.`);
  await i.update({ embeds: [embed], components: [] });
}

async function handleProofButton(i: ButtonInteraction) {
  const orderId = i.customId.split(":")[1];
  const order = ORDERS.get(orderId);
  if (!order) {
    await i.reply({ content: "❌ Pesanan tidak ditemukan.", ephemeral: true });
    return;
  }
  if (!i.channel || !i.guild) {
    await i.reply({ content: "❌ Hanya bisa di tiket order.", ephemeral: true });
    return;
  }

  PENDING_PROOFS_BY_CHANNEL.set(i.channel.id, {
    orderId,
    ownerId: order.userId,
    expiresAt: Date.now() + 30 * 60 * 1000,
  });

  const embed = new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle("📤 Kirim Foto Bukti Transfer")
    .setDescription(
      [
        `**Order ID:** \`${orderId}\``,
        `**Produk:** ${order.productName}`,
        `**Total:** ${formatRupiah(order.price)}`,
        "",
        `<@${order.userId}>, silakan **kirim foto bukti transfer** sebagai lampiran di channel ini.`,
        "",
        "**Tulis nama pengirim** sebagai caption foto, contoh: `Budi Santoso`.",
        "",
        "⏰ Sesi upload aktif 30 menit.",
      ].join("\n"),
    );

  await i.reply({ embeds: [embed] });
}

client.on(Events.MessageCreate, async (msg: Message) => {
  try {
    if (msg.author.bot) return;
    if (!msg.guild || !msg.channel) return;

    const pending = PENDING_PROOFS_BY_CHANNEL.get(msg.channel.id);
    if (!pending) return;
    if (msg.author.id !== pending.ownerId) return;

    if (Date.now() > pending.expiresAt) {
      PENDING_PROOFS_BY_CHANNEL.delete(msg.channel.id);
      await msg.reply("⏰ Sesi upload bukti sudah kadaluarsa. Klik tombol **Upload Bukti** lagi.");
      return;
    }

    const order = ORDERS.get(pending.orderId);
    if (!order) {
      PENDING_PROOFS_BY_CHANNEL.delete(msg.channel.id);
      await msg.reply("❌ Pesanan tidak ditemukan.");
      return;
    }

    const attachment = msg.attachments.find((a) =>
      (a.contentType ?? "").startsWith("image/"),
    );
    if (!attachment) return;

    const sender = (msg.content || "").trim() || msg.author.username;

    PENDING_PROOFS_BY_CHANNEL.delete(msg.channel.id);
    order.proofUrl = attachment.url;
    order.status = "waiting_verification";

    const method = PAYMENT_METHODS.find((m) => m.id === order.paymentMethod);

    const verifyEmbed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle("💳 Pembayaran Masuk — Perlu Verifikasi Admin")
      .setDescription(
        STAFF_ROLE_ID
          ? `<@&${STAFF_ROLE_ID}>, ada bukti baru dari <@${order.userId}>.`
          : `Menunggu verifikasi admin.`,
      )
      .addFields(
        { name: "Order ID", value: `\`${order.orderId}\``, inline: true },
        { name: "Buyer", value: `<@${order.userId}>`, inline: true },
        { name: "Produk", value: order.productName, inline: true },
        { name: "Total", value: formatRupiah(order.price), inline: true },
        { name: "Metode", value: method?.label ?? "-", inline: true },
        { name: "Pengirim", value: sender, inline: true },
        { name: "Kontak Buyer", value: order.contact, inline: false },
        { name: "Catatan", value: order.note, inline: false },
      )
      .setImage(attachment.url)
      .setTimestamp();

    const adminRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`admin_approve:${order.orderId}`)
        .setLabel("✅ Setujui (Lunas)")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`admin_reject:${order.orderId}`)
        .setLabel("❌ Tolak")
        .setStyle(ButtonStyle.Danger),
    );

    await (msg.channel as TextChannel).send({
      content: STAFF_ROLE_ID ? `<@&${STAFF_ROLE_ID}>` : undefined,
      embeds: [verifyEmbed],
      components: [adminRow],
      allowedMentions: { roles: STAFF_ROLE_ID ? [STAFF_ROLE_ID] : [] },
    });
  } catch (err) {
    console.error("Proof handler error:", err);
  }
});

async function handleAdminAction(i: ButtonInteraction, action: "approve" | "reject") {
  const member = i.member as GuildMember | null;
  const isAdmin = member?.permissions.has(PermissionFlagsBits.ManageGuild);
  const isStaff = STAFF_ROLE_ID && member?.roles.cache.has(STAFF_ROLE_ID);
  if (!isAdmin && !isStaff) {
    await i.reply({ content: "❌ Hanya admin/staff yang bisa verifikasi.", ephemeral: true });
    return;
  }
  const orderId = i.customId.split(":")[1];
  const order = ORDERS.get(orderId);
  if (!order) {
    await i.reply({ content: "❌ Pesanan tidak ditemukan.", ephemeral: true });
    return;
  }
  order.status = action === "approve" ? "paid" : "cancelled";

  let roleGrantedNote = "";
  if (action === "approve") {
    const product = PRODUCTS.find((p) => p.id === order.productId);
    const roleEnv = product?.grantRoleEnv;
    const roleId = roleEnv ? process.env[roleEnv] : undefined;
    if (roleId && i.guild) {
      try {
        const buyerMember = await i.guild.members.fetch(order.userId);
        await buyerMember.roles.add(roleId, `Order ${orderId} approved`);
        roleGrantedNote = `\n🎁 Role <@&${roleId}> otomatis diberikan ke <@${order.userId}>.`;
      } catch (err) {
        console.error("Auto role grant failed:", err);
        roleGrantedNote = `\n⚠️ Gagal beri role otomatis. Cek: bot punya **Manage Roles** & posisi role bot **di atas** role tujuan. Set juga env \`${roleEnv}\`.`;
      }
    } else if (roleEnv && !roleId) {
      roleGrantedNote = `\n⚠️ Produk ini perlu role otomatis tapi env \`${roleEnv}\` belum diset.`;
    }
  }

  const updated = EmbedBuilder.from(i.message.embeds[0])
    .setColor(action === "approve" ? 0x10b981 : 0xef4444)
    .setTitle(
      action === "approve"
        ? `✅ Order ${orderId} — LUNAS`
        : `❌ Order ${orderId} — DITOLAK`,
    )
    .setFooter({
      text: `Diverifikasi oleh ${i.user.username}${roleGrantedNote ? " • role otomatis" : ""}`,
    });

  await i.update({
    embeds: [updated],
    components: [],
    content: roleGrantedNote || null,
  });

  if (i.channel && TICKETS.has(i.channel.id)) {
    const verdictEmbed = new EmbedBuilder()
      .setColor(action === "approve" ? 0x10b981 : 0xef4444)
      .setTitle(
        action === "approve"
          ? "🎉 Pesanan LUNAS!"
          : "😔 Pembayaran Ditolak",
      )
      .setDescription(
        action === "approve"
          ? `Pesanan **${orderId}** sudah **LUNAS**. ${roleGrantedNote ? "Role kamu sudah aktif!" : "Admin akan segera memproses pesananmu."}\n\nKlik **🔒 Tutup Tiket** jika sudah selesai.`
          : `Pesanan **${orderId}** ditolak. Bukti tidak valid atau dana belum masuk. Hubungi admin untuk info lebih lanjut.`,
      );
    await (i.channel as TextChannel).send({
      content: `<@${order.userId}>`,
      embeds: [verdictEmbed],
      components: [buildTicketCloseRow(i.channel.id)],
      allowedMentions: { users: [order.userId] },
    });
  }

  try {
    const buyer = await client.users.fetch(order.userId);
    await buyer
      .send({
        content:
          action === "approve"
            ? `🎉 Pesanan **${orderId}** (${order.productName}) sudah **LUNAS**.${roleGrantedNote ? " Role kamu sudah aktif!" : " Admin akan segera memproses pesanan kamu!"}`
            : `😔 Maaf, pesanan **${orderId}** ditolak. Bukti tidak valid atau dana belum masuk. Hubungi admin untuk info lebih lanjut.`,
      })
      .catch(() => {});
  } catch {
    // ignore DM failure
  }
}

function rand(n: number) {
  return Math.floor(Math.random() * n);
}

async function gameSlot(i: ButtonInteraction) {
  const bal = getBalance(i.user.id);
  const bet = 20;
  if (bal.coins < bet) {
    await i.reply({
      content: `❌ Coin tidak cukup. Butuh ${bet} coin. Saldo: ${bal.coins}.`,
      ephemeral: true,
    });
    return;
  }
  bal.coins -= bet;
  const symbols = ["🍒", "🍋", "🔔", "💎", "7️⃣", "⭐"];
  const reels = [rand(symbols.length), rand(symbols.length), rand(symbols.length)].map(
    (x) => symbols[x],
  );
  let payout = 0;
  let result = "Coba lagi!";
  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    payout = bet * 10;
    result = "🎉 JACKPOT!";
  } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
    payout = bet * 2;
    result = "✨ 2 sama, kamu menang sedikit!";
  }
  bal.coins += payout;
  const embed = new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle("🎰 Slot Machine")
    .setDescription(
      `\`\`\`\n[ ${reels.join(" | ")} ]\n\`\`\`\n${result}\n\nTaruhan: **${bet}** | Hadiah: **${payout}**\nSaldo sekarang: **${bal.coins}** 🪙`,
    );
  await i.reply({ embeds: [embed], ephemeral: true });
}

async function gameDice(i: ButtonInteraction) {
  const bal = getBalance(i.user.id);
  const bet = 15;
  if (bal.coins < bet) {
    await i.reply({
      content: `❌ Coin tidak cukup. Butuh ${bet} coin.`,
      ephemeral: true,
    });
    return;
  }
  const embed = new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle("🎲 Tebak Dadu")
    .setDescription(
      `Taruhan **${bet}** coin. Tebak hasil dadu (1-6): **Besar (4-6)** atau **Kecil (1-3)**?\nHadiah: 2x lipat jika benar.`,
    );
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`dice_pick:big:${bet}`)
      .setLabel("Besar (4-6)")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`dice_pick:small:${bet}`)
      .setLabel("Kecil (1-3)")
      .setStyle(ButtonStyle.Primary),
  );
  await i.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function dicePick(i: ButtonInteraction) {
  const [, pick, betStr] = i.customId.split(":");
  const bet = parseInt(betStr, 10);
  const bal = getBalance(i.user.id);
  if (bal.coins < bet) {
    await i.update({
      content: "❌ Saldo tidak cukup.",
      embeds: [],
      components: [],
    });
    return;
  }
  bal.coins -= bet;
  const roll = rand(6) + 1;
  const isBig = roll >= 4;
  const win = (pick === "big" && isBig) || (pick === "small" && !isBig);
  const payout = win ? bet * 2 : 0;
  bal.coins += payout;
  const embed = new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle("🎲 Hasil Dadu")
    .setDescription(
      `Dadu: **${roll}** (${isBig ? "Besar" : "Kecil"})\nTebakanmu: **${pick === "big" ? "Besar" : "Kecil"}**\n${win ? `🎉 Menang +${payout}!` : "💔 Kalah."}\n\nSaldo: **${bal.coins}** 🪙`,
    );
  await i.update({ embeds: [embed], components: [] });
}

async function gameRPS(i: ButtonInteraction) {
  const bal = getBalance(i.user.id);
  const bet = 10;
  if (bal.coins < bet) {
    await i.reply({
      content: `❌ Coin tidak cukup. Butuh ${bet} coin.`,
      ephemeral: true,
    });
    return;
  }
  const embed = new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle("✊ Suit (RPS)")
    .setDescription(`Taruhan **${bet}** coin. Pilih:`);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`rps:rock:${bet}`)
      .setLabel("✊ Batu")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`rps:paper:${bet}`)
      .setLabel("✋ Kertas")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`rps:scissors:${bet}`)
      .setLabel("✌️ Gunting")
      .setStyle(ButtonStyle.Primary),
  );
  await i.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function rpsPick(i: ButtonInteraction) {
  const [, pick, betStr] = i.customId.split(":");
  const bet = parseInt(betStr, 10);
  const bal = getBalance(i.user.id);
  if (bal.coins < bet) {
    await i.update({ content: "❌ Saldo tidak cukup.", embeds: [], components: [] });
    return;
  }
  bal.coins -= bet;
  const choices = ["rock", "paper", "scissors"];
  const bot = choices[rand(3)];
  let outcome: "win" | "lose" | "draw" = "draw";
  if (pick !== bot) {
    if (
      (pick === "rock" && bot === "scissors") ||
      (pick === "paper" && bot === "rock") ||
      (pick === "scissors" && bot === "paper")
    ) {
      outcome = "win";
    } else {
      outcome = "lose";
    }
  }
  let payout = 0;
  let txt = "";
  if (outcome === "win") {
    payout = bet * 2;
    txt = `🎉 Menang +${payout}!`;
  } else if (outcome === "draw") {
    payout = bet;
    txt = "🤝 Seri, taruhan dikembalikan.";
  } else {
    txt = "💔 Kalah.";
  }
  bal.coins += payout;
  const emoji: Record<string, string> = {
    rock: "✊ Batu",
    paper: "✋ Kertas",
    scissors: "✌️ Gunting",
  };
  const embed = new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle("✊ Hasil Suit")
    .setDescription(
      `Kamu: **${emoji[pick]}**\nBot: **${emoji[bot]}**\n\n${txt}\nSaldo: **${bal.coins}** 🪙`,
    );
  await i.update({ embeds: [embed], components: [] });
}

async function gameCoin(i: ButtonInteraction) {
  const bal = getBalance(i.user.id);
  const bet = 10;
  if (bal.coins < bet) {
    await i.reply({
      content: `❌ Coin tidak cukup. Butuh ${bet} coin.`,
      ephemeral: true,
    });
    return;
  }
  const embed = new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle("🪙 Coinflip")
    .setDescription(`Taruhan **${bet}** coin. Pilih sisi koin:`);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`coin:heads:${bet}`)
      .setLabel("Heads (Kepala)")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`coin:tails:${bet}`)
      .setLabel("Tails (Ekor)")
      .setStyle(ButtonStyle.Primary),
  );
  await i.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function coinPick(i: ButtonInteraction) {
  const [, pick, betStr] = i.customId.split(":");
  const bet = parseInt(betStr, 10);
  const bal = getBalance(i.user.id);
  if (bal.coins < bet) {
    await i.update({ content: "❌ Saldo tidak cukup.", embeds: [], components: [] });
    return;
  }
  bal.coins -= bet;
  const flip = Math.random() < 0.5 ? "heads" : "tails";
  const win = flip === pick;
  const payout = win ? bet * 2 : 0;
  bal.coins += payout;
  const embed = new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle("🪙 Hasil Coinflip")
    .setDescription(
      `Hasil: **${flip === "heads" ? "Heads (Kepala)" : "Tails (Ekor)"}**\nTebakanmu: **${pick === "heads" ? "Heads" : "Tails"}**\n${win ? `🎉 Menang +${payout}!` : "💔 Kalah."}\n\nSaldo: **${bal.coins}** 🪙`,
    );
  await i.update({ embeds: [embed], components: [] });
}

async function showBalance(i: ButtonInteraction | ChatInputCommandInteraction) {
  const bal = getBalance(i.user.id);
  const embed = new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle("💰 Saldo Coin")
    .setDescription(
      `**${i.user.username}**, saldo kamu: **${bal.coins}** 🪙\n\nKlaim harian: \`/daily\``,
    );
  await i.reply({ embeds: [embed], ephemeral: true });
}

async function claimDaily(i: ChatInputCommandInteraction) {
  const bal = getBalance(i.user.id);
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (now - bal.lastDaily < day) {
    const remain = day - (now - bal.lastDaily);
    const hours = Math.floor(remain / (60 * 60 * 1000));
    const mins = Math.floor((remain % (60 * 60 * 1000)) / (60 * 1000));
    await i.reply({
      content: `⏰ Sudah klaim hari ini. Coba lagi dalam **${hours}j ${mins}m**.`,
      ephemeral: true,
    });
    return;
  }
  bal.coins += 100;
  bal.lastDaily = now;
  await i.reply({
    content: `🎁 Kamu mendapat **100 coin**! Saldo sekarang: **${bal.coins}** 🪙`,
    ephemeral: true,
  });
}

async function sendAnnouncement(i: ChatInputCommandInteraction) {
  const judul = i.options.getString("judul", true);
  const pesan = i.options.getString("pesan", true);
  const channelOpt = i.options.getChannel("channel", false);
  const mention = i.options.getBoolean("mention_everyone", false) ?? false;

  const target = channelOpt ?? i.channel;
  if (!target || !("send" in target) || typeof (target as any).send !== "function") {
    await i.reply({ content: "❌ Channel tidak valid.", ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle(`📣 ${judul}`)
    .setDescription(pesan)
    .setFooter({ text: `Diumumkan oleh ${i.user.username}` })
    .setTimestamp();

  try {
    await (target as any).send({
      content: mention ? "@everyone" : undefined,
      embeds: [embed],
      allowedMentions: { parse: mention ? ["everyone"] : [] },
    });
    await i.reply({
      content: `✅ Pengumuman terkirim ke <#${(target as any).id}>.`,
      ephemeral: true,
    });
  } catch (err) {
    console.error("Announce failed:", err);
    await i.reply({
      content: "❌ Gagal mengirim. Cek permission bot di channel tersebut.",
      ephemeral: true,
    });
  }
}

async function showOrders(i: ChatInputCommandInteraction) {
  const all = Array.from(ORDERS.values());
  if (all.length === 0) {
    await i.reply({ content: "Belum ada order.", ephemeral: true });
    return;
  }
  const recent = all.slice(-10).reverse();
  const embed = new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle("📋 Order Terbaru (10 terakhir)")
    .setDescription(
      recent
        .map((o) => {
          const statusEmoji =
            o.status === "paid"
              ? "✅"
              : o.status === "waiting_verification"
                ? "⏳"
                : o.status === "cancelled"
                  ? "🚫"
                  : "🕒";
          return `${statusEmoji} **${o.orderId}** • <@${o.userId}> • ${o.productName} • ${formatRupiah(o.price)}\n└ ${o.contact} • _${o.status}_`;
        })
        .join("\n\n"),
    );
  await i.reply({ embeds: [embed], ephemeral: true });
}

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const name = interaction.commandName;
      if (name === "setup-verify") {
        await interaction.channel?.send(buildVerifyPanel());
        await interaction.reply({ content: "✅ Panel verifikasi terkirim.", ephemeral: true });
      } else if (name === "setup-store") {
        await interaction.channel?.send(buildStorePanel());
        await interaction.reply({ content: "✅ Panel store terkirim.", ephemeral: true });
      } else if (name === "setup-game") {
        await interaction.channel?.send(buildGamePanel());
        await interaction.reply({ content: "✅ Panel game terkirim.", ephemeral: true });
      } else if (name === "setup-ticket") {
        await interaction.channel?.send(buildTicketPanel());
        await interaction.reply({ content: "✅ Panel tiket terkirim.", ephemeral: true });
      } else if (name === "store") {
        await interaction.reply(buildStorePanel());
      } else if (name === "game") {
        await interaction.reply(buildGamePanel());
      } else if (name === "balance") {
        await showBalance(interaction);
      } else if (name === "daily") {
        await claimDaily(interaction);
      } else if (name === "orders") {
        await showOrders(interaction);
      } else if (name === "announce") {
        await sendAnnouncement(interaction);
      }
    } else if (interaction.isButton()) {
      const id = interaction.customId;
      if (id === "verify_btn") await handleVerify(interaction);
      else if (id === "game_slot") await gameSlot(interaction);
      else if (id === "game_dice") await gameDice(interaction);
      else if (id === "game_rps") await gameRPS(interaction);
      else if (id === "game_coin") await gameCoin(interaction);
      else if (id === "game_balance") await showBalance(interaction);
      else if (id.startsWith("dice_pick:")) await dicePick(interaction);
      else if (id.startsWith("rps:")) await rpsPick(interaction);
      else if (id.startsWith("coin:")) await coinPick(interaction);
      else if (id.startsWith("pay_proof:")) await handleProofButton(interaction);
      else if (id.startsWith("pay_change:")) await handlePaymentChange(interaction);
      else if (id.startsWith("order_cancel:")) await handleOrderCancel(interaction);
      else if (id.startsWith("admin_approve:"))
        await handleAdminAction(interaction, "approve");
      else if (id.startsWith("admin_reject:"))
        await handleAdminAction(interaction, "reject");
      else if (id.startsWith("ticket_close:"))
        await handleTicketClose(interaction);
    } else if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "store_select")
        await handleStoreSelect(interaction);
      else if (interaction.customId.startsWith("pay_select:"))
        await handlePaymentSelect(interaction);
      else if (interaction.customId === "ticket_create")
        await handleTicketCreate(interaction);
    } else if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith("order_modal:"))
        await handleOrderSubmit(interaction);
    }
  } catch (err) {
    console.error("Interaction error:", err);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction
        .reply({ content: "❌ Terjadi kesalahan internal.", ephemeral: true })
        .catch(() => {});
    }
  }
});

client.on(Events.Error, (e) => console.error("Client error:", e));

client.login(TOKEN);
