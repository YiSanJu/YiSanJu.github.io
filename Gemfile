source "https://rubygems.org"

# Ruby 4.0+ 需要的额外依赖
gem "csv"
gem "base64"
gem "bigdecimal"
gem "mutex_m"

# Jekyll 核心
gem "jekyll", "~> 4.3.0"

# 主题
gem "minima", "~> 2.5"

# 插件
group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.12"
  gem "jekyll-sitemap"
  gem "jekyll-seo-tag"
  gem "jekyll-paginate"
end

# Windows 平台兼容性
platforms :mingw, :x64_mingw, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

# Windows 性能优化
gem "wdm", "~> 0.1", platforms: [:mingw, :x64_mingw, :mswin]
