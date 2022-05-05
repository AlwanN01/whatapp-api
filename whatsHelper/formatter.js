export const phoneFormat = number => {
  //menghilangkan karakter selain angka
  number = number.replace(/[^0-9]/g, '')
  //menggantikan karakter pertama jika berawalan dengan '0' dengan karakter '62'
  number = number.replace(/^0/, '62')
  //menambahkan karakter '@c.us' diakhir jika ada
  number = number.includes('@c.us') ? number : `${number}@c.us`
  return number
}
