import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'KVKK Aydınlatma Metni — Spark',
  description: 'Spark platformunda kişisel verilerinizin korunması hakkında bilgilendirme.',
}

const LAST_UPDATED = '8 Mart 2026'

export default function KvkkPage() {
  return (
    <div>
      <header className="mb-10">
        <h1 className="text-text-primary text-3xl font-bold tracking-tight sm:text-4xl">
          KVKK Aydınlatma Metni
        </h1>
        <p className="text-text-muted mt-2 text-sm">Son güncelleme: {LAST_UPDATED}</p>
      </header>

      <div className="border-border bg-surface mb-8 rounded-xl border p-6">
        <p className="text-text-secondary text-sm leading-relaxed">
          Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;)
          kapsamında, Spark Technologies Ltd. (&ldquo;Şirket&rdquo;) tarafından kişisel
          verilerinizin işlenmesine ilişkin sizleri bilgilendirmek amacıyla hazırlanmıştır.
        </p>
      </div>

      {/* Table of Contents */}
      <nav className="border-border bg-surface mb-12 rounded-xl border p-6">
        <h2 className="text-text-muted mb-3 text-sm font-semibold uppercase tracking-wider">
          İçindekiler
        </h2>
        <ol className="text-text-secondary list-inside list-decimal space-y-1.5 text-sm">
          <li>
            <a href="#veri-sorumlusu" className="hover:text-primary">
              Veri Sorumlusu
            </a>
          </li>
          <li>
            <a href="#kisisel-veriler" className="hover:text-primary">
              İşlenen Kişisel Veriler
            </a>
          </li>
          <li>
            <a href="#islenme-amaclari" className="hover:text-primary">
              Kişisel Verilerin İşlenme Amaçları
            </a>
          </li>
          <li>
            <a href="#aktarim" className="hover:text-primary">
              Kişisel Verilerin Aktarımı
            </a>
          </li>
          <li>
            <a href="#haklariniz" className="hover:text-primary">
              İlgili Kişi Olarak Haklarınız
            </a>
          </li>
          <li>
            <a href="#iletisim" className="hover:text-primary">
              İletişim
            </a>
          </li>
        </ol>
      </nav>

      {/* Sections */}
      <div className="space-y-10">
        <Section id="veri-sorumlusu" title="1. Veri Sorumlusu">
          <p>KVKK kapsamında veri sorumlusu aşağıda bilgileri bulunan tüzel kişidir:</p>
          <div className="border-border bg-surface rounded-lg border p-4">
            <p className="text-text-primary font-medium">Spark Technologies Ltd.</p>
            <p className="text-text-secondary">Adres: [Şirket adresi placeholder]</p>
            <p className="text-text-secondary">Mersis No: [Mersis numarası placeholder]</p>
            <p className="text-text-secondary">E-posta: kvkk@spark.app</p>
          </div>
          <Placeholder />
        </Section>

        <Section id="kisisel-veriler" title="2. İşlenen Kişisel Veriler">
          <p>Platformumuz aracılığıyla aşağıdaki kişisel veriler işlenebilmektedir:</p>
          <ul>
            <li>
              <strong>Kimlik Bilgileri:</strong> Ad, soyad, doğum tarihi, cinsiyet
            </li>
            <li>
              <strong>İletişim Bilgileri:</strong> E-posta adresi, telefon numarası
            </li>
            <li>
              <strong>Görsel Veriler:</strong> Profil fotoğrafları, video profil
            </li>
            <li>
              <strong>Konum Verileri:</strong> Yaklaşık konum bilgisi (izninizle)
            </li>
            <li>
              <strong>Kullanım Verileri:</strong> Uygulama kullanım istatistikleri, cihaz bilgileri
            </li>
            <li>
              <strong>Finansal Veriler:</strong> Ödeme bilgileri, token işlem geçmişi
            </li>
            <li>
              <strong>İletişim İçerik:</strong> Platform içi mesajlar
            </li>
          </ul>
          <Placeholder />
        </Section>

        <Section id="islenme-amaclari" title="3. Kişisel Verilerin İşlenme Amaçları">
          <p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
          <ul>
            <li>Üyelik işlemlerinin yürütülmesi ve hesap yönetimi</li>
            <li>Eşleştirme ve öneri hizmetlerinin sunulması</li>
            <li>Ödeme işlemlerinin gerçekleştirilmesi</li>
            <li>Platform güvenliğinin sağlanması ve dolandırıcılık önleme</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            <li>Hizmet kalitesinin artırılması ve analiz</li>
            <li>Bildirim ve iletişim hizmetleri</li>
          </ul>
          <Placeholder />
        </Section>

        <Section id="aktarim" title="4. Kişisel Verilerin Aktarımı">
          <p>
            Kişisel verileriniz, KVKK&apos;nın 8. ve 9. maddelerinde belirtilen şartlar çerçevesinde
            aşağıdaki taraflara aktarılabilir:
          </p>
          <ul>
            <li>
              <strong>Hizmet Sağlayıcılar:</strong> Barındırma, ödeme işlem, analitik hizmetleri
              sunan iş ortakları
            </li>
            <li>
              <strong>Yetkili Kamu Kurumları:</strong> Yasal zorunluluk halinde ilgili kamu kurum ve
              kuruluşları
            </li>
            <li>
              <strong>Yurtdışı Aktarım:</strong> Hizmetlerimizin sunulması için gerekli olduğunda,
              yeterli koruma seviyesine sahip ülkelere veya uygun güvenceler sağlayarak yurtdışına
              aktarım yapılabilir
            </li>
          </ul>
          <Placeholder />
        </Section>

        <Section id="haklariniz" title="5. İlgili Kişi Olarak Haklarınız">
          <p>KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
          <ul>
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
            <li>
              Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp
              kullanılmadığını öğrenme
            </li>
            <li>
              Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme
            </li>
            <li>
              Kişisel verilerin eksik veya yanlış işlenmiş olması halinde bunların düzeltilmesini
              isteme
            </li>
            <li>
              KVKK&apos;nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerin
              silinmesini veya yok edilmesini isteme
            </li>
            <li>
              İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle
              aleyhinize bir sonucun ortaya çıkmasına itiraz etme
            </li>
            <li>
              Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız halinde
              zararın giderilmesini talep etme
            </li>
          </ul>
          <Placeholder />
        </Section>

        <Section id="iletisim" title="6. İletişim">
          <p>
            KVKK kapsamındaki haklarınızı kullanmak için aşağıdaki kanallardan bize ulaşabilirsiniz:
          </p>
          <div className="border-border bg-surface rounded-lg border p-4">
            <p className="text-text-primary font-medium">Spark Technologies Ltd.</p>
            <p className="text-text-secondary">Kişisel Verilerin Korunması Birimi</p>
            <p className="text-text-secondary">E-posta: kvkk@spark.app</p>
            <p className="text-text-secondary">Adres: [Şirket adresi placeholder]</p>
          </div>
          <p className="text-text-muted mt-4 text-sm">
            Başvurularınız en geç 30 gün içinde ücretsiz olarak sonuçlandırılır. İşlemin ayrıca bir
            maliyet gerektirmesi halinde, Kişisel Verileri Koruma Kurulu tarafından belirlenen
            tarife uygulanabilir.
          </p>
        </Section>
      </div>
    </div>
  )
}

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="text-text-primary mb-4 text-xl font-semibold">{title}</h2>
      <div className="text-text-secondary [&_strong]:text-text-primary space-y-3 [&_li]:ml-4 [&_li]:list-disc [&_p]:leading-relaxed [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  )
}

function Placeholder() {
  return (
    <div className="border-border bg-surface-elevated/50 mt-4 rounded-lg border border-dashed px-4 py-3">
      <p className="text-text-muted text-xs font-medium italic">
        [Placeholder — Tam yasal metin hukuk danışmanı tarafından sağlanacaktır]
      </p>
    </div>
  )
}
