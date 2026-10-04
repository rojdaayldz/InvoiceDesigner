# 🧾 Invoice Designer

Invoice Designer, **ASP.NET Core MVC** ve **GrapesJS** kullanılarak geliştirilmiş web tabanlı bir fatura tasarım uygulamasıdır.

Proje; kullanıcıların sürükle-bırak yöntemiyle özelleştirilebilir fatura şablonları oluşturmasına, müşteri ve fatura verilerini tasarım alanlarına dinamik olarak bağlamasına, hazırlanan faturayı önizlemesine ve PDF olarak oluşturmasına olanak sağlar.

Proje, yazılım geliştirme stajı kapsamında geliştirilmiştir ve görsel bir tasarım editörünün dinamik verilerle ve PDF üretimiyle entegre edilmesine odaklanmaktadır.

## ✨ Özellikler

- 🎨 Sürükle-bırak fatura tasarım editörü
- 🧩 Özelleştirilebilir fatura bileşenleri
- 👤 Dinamik müşteri bilgileri
- 🧾 Dinamik fatura bilgileri
- 📦 Ürün/fatura kalemleri tablosu
- 🔗 Dinamik veri bağlama
- 👁️ Fatura önizleme
- 📄 PDF oluşturma
- 💾 Şablon kaydetme ve yükleme
- 🖼️ Logo desteği
- 📱 QR kod bileşeni
- ✍️ İmza alanı
- 📋 Fatura verilerinin tasarıma aktarılması

## 🧩 Tasarım Bileşenleri

Editör içerisinde fatura tasarımında kullanılabilecek çeşitli bileşenler bulunmaktadır:

- Logo
- Metin
- Çizgi
- Kutu
- QR Kod
- Ürün Tablosu
- İmza Alanı
- Müşteri Bilgileri
- Fatura Bilgileri

Bu bileşenler sürükle-bırak yöntemiyle tasarım alanına eklenebilir ve kullanıcı tarafından düzenlenebilir.

## 🔗 Dinamik Veri Bağlama

Fatura tasarımındaki alanlar uygulamadaki verilerle dinamik olarak eşleştirilebilir.

### Müşteri Verileri

Müşteriye ait bilgiler fatura şablonundaki ilgili alanlara dinamik olarak aktarılabilir.

### Fatura Verileri

Fatura bilgileri tasarım içerisindeki bileşenlere bağlanabilir.

### Ürün Bilgileri

Fatura içerisindeki ürünler dinamik bir tablo yapısı üzerinden gösterilebilir.

Desteklenen ürün alanlarından bazıları:

```text
ProductCode
ProductName
Quantity
UnitPrice
LineTotal
```

Bu yapı sayesinde aynı fatura şablonu farklı müşteri ve fatura verileriyle tekrar kullanılabilir.

## 💾 Şablon Yönetimi

Hazırlanan fatura tasarımları şablon olarak kaydedilebilir ve daha sonra tekrar kullanılabilir.

Kullanıcılar:

- Yeni şablon kaydedebilir
- Seçili şablonu yükleyebilir
- Son kaydedilen şablonu yükleyebilir
- Mevcut tasarımı düzenleyebilir
- Şablonları farklı fatura verileriyle kullanabilir

## 📄 PDF Oluşturma

Hazırlanan fatura tasarımları PDF formatına dönüştürülebilir.

PDF oluşturma işlemi için **PuppeteerSharp** kullanılmaktadır. Tasarımın HTML çıktısı render edilerek PDF belgesi oluşturulur.

## 🗄️ Veri Yapısı

Projede temel olarak aşağıdaki veri modelleri kullanılmaktadır:

### Template

Oluşturulan fatura tasarımlarının şablon olarak saklanmasını sağlar.

### Customer

Faturalarda kullanılacak müşteri bilgilerini tutar.

### Invoice

Faturaya ait temel bilgileri ve müşteri ilişkisini içerir.

### InvoiceItem

Faturada bulunan ürün veya hizmet kalemlerini temsil eder.

Örnek alanlar:

```text
ProductCode
ProductName
Quantity
UnitPrice
LineTotal
```

## 🛠️ Kullanılan Teknolojiler

### Backend

- ASP.NET Core MVC
- .NET 8
- C#
- Entity Framework Core 8

### Frontend

- HTML
- CSS
- JavaScript
- GrapesJS

### PDF

- PuppeteerSharp

### Veritabanı

- Entity Framework Core
- İlişkisel veritabanı yapısı

## 🏗️ Sistem Akışı

```text
Fatura Verileri
      │
      ▼
Müşteri / Fatura / Ürünler
      │
      ▼
Dinamik Veri Bağlama
      │
      ▼
GrapesJS Tasarım Editörü
      │
      ├────► Şablon Kaydet / Yükle
      │
      ▼
Fatura Önizleme
      │
      ▼
PuppeteerSharp
      │
      ▼
PDF Çıktısı
```

## 🚀 Kurulum

### Gereksinimler

- .NET 8 SDK
- Uyumlu bir veritabanı
- PuppeteerSharp için gerekli Chromium bileşenleri

Projeyi klonlayın:

```bash
git clone <repository-url>
```

Proje klasörüne geçin:

```bash
cd InvoiceDesigner
```

Bağımlılıkları yükleyin:

```bash
dotnet restore
```

Veritabanı bağlantısını yerel geliştirme ortamınıza göre yapılandırın.

Gerekliyse migration'ları uygulayın:

```bash
dotnet ef database update
```

Projeyi çalıştırın:

```bash
dotnet run
```

Terminalde gösterilen yerel adres üzerinden uygulamaya erişebilirsiniz.

## 🔐 Güvenlik

Veritabanı kullanıcı adı, parola, connection string veya diğer hassas bilgiler GitHub reposuna eklenmemelidir.

Bu bilgiler için environment variables, .NET User Secrets veya `.gitignore` ile hariç tutulan yerel yapılandırma dosyaları kullanılabilir.

## 📸 Ekran Görüntüleri

Bu bölüme uygulamanın çalışan halinden ekran görüntüleri eklenebilir.

Örneğin:

```text
/screenshots
    designer.png
    preview.png
    generated-invoice.png
```

Özellikle aşağıdaki ekranların gösterilmesi önerilir:

- Fatura tasarım editörü
- Sürükle-bırak bileşenleri
- Dinamik veri alanları
- Hazırlanan fatura
- Önizleme ekranı
- Oluşturulan PDF

## 🔮 Gelecek Geliştirmeler

Projeye ilerleyen aşamalarda aşağıdaki özellikler eklenebilir:

- Responsive tasarım geliştirmeleri
- Yeni fatura bileşenleri
- Gelişmiş bileşen özelleştirme seçenekleri
- Şablon kopyalama
- Şablon versiyonlama
- PDF ve tasarım görünümü arasındaki uyumun geliştirilmesi
- Kullanıcı giriş sistemi
- Yetkilendirme
- REST API desteği
- Docker desteği
- Cloud ortamında yayınlama

## 🎯 Projenin Amacı

Bu proje, görsel bir sürükle-bırak editörünün backend sistemi ve dinamik verilerle nasıl entegre edilebileceğini uygulamalı olarak geliştirmek amacıyla oluşturulmuştur.

Proje sürecinde özellikle:

- ASP.NET Core MVC mimarisi
- Entity Framework Core
- Veritabanı işlemleri
- Dinamik frontend bileşenleri
- Veri bağlama
- Şablon yönetimi
- HTML'den PDF oluşturma
- Full-stack uygulama geliştirme

konularında çalışma yapılmıştır.

## 👩‍💻 Geliştirici

**Rojda Yıldız**

Bilgisayar Mühendisliği
